/*
 * routes definition and handling for paramHashRouter
 */

import Mustache from "./mustache.js";
import processOpnFrmData from "./opinionsHandler.js";
import articleFormsHandler from "./articleFormsHandler.js";



export default[

    {
        //the part after '#' in the url (fragment):
        hash:"welcome",
        target:"router-view",
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML
    },
    {
        hash:"articles",
        target:"router-view",
        getTemplate: fetchAndDisplayArticles
    },
    {
        hash:"opinions",
        target:"router-view",
        getTemplate: createHtml4opinions
    },
    {
        hash: "addOpinion",
        target: "router-view",
        getTemplate: (targetElm) => {
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML;
            const form = document.getElementById("opnFrm");
    
            //empty info if not loggedin
            form.elements["opnElm"].value = loggedInUser || ""; 
            form.elements["nopOpn"].value = loggedInUserEmail || ""; 
    
            form.onsubmit = processOpnFrmData;
        },
    },
    
    {
        hash:"article",
        target:"router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },
    {
        hash:"artEdit",
        target:"router-view",
        getTemplate: editArticle
    },
    {
        hash:"artDelete",
        target:"router-view",
        getTemplate: deleteArticle
    },
    { 
        hash:"articleComments", 
        target:"comments-view", 
        getTemplate: fetchAndDisplayArticleComments
    }
    
];       

    const urlBase = "https://wt.kpi.fei.tuke.sk/api";

     //---------------OPINIONS---------------
    function createHtml4opinions(targetElm) {
        const opinionsFromStorage = localStorage.myTreesComments;
        let opinions = [];

        if (opinionsFromStorage) {
            opinions = JSON.parse(opinionsFromStorage);
            opinions.forEach(opinion => {
                opinion.created = (new Date(opinion.created)).toDateString();
                opinion.willReturn =
                opinion.willReturn ? "I will return to this page." : "Sorry, one visit was enough.";
            });
        }

        document.getElementById(targetElm).innerHTML = Mustache.render(
            document.getElementById("template-opinions").innerHTML,
            opinions
        );
    }
     
    //---------------DISPLAY ARTICLE---------------
    export function fetchAndDisplayArticles(targetElm, offsetFromHash = 0, totalCountFromHash = 0, newArticle = null) {
        const offset = Number(offsetFromHash);
        const totalCount = Number(totalCountFromHash);
        const articlesPerPage = 10; 

        let urlQuery = `?max=${articlesPerPage}`;
        if (offset) {
            urlQuery += `&offset=${offset}`;
        }

        const uniqueTag = 'Fabricea';
        urlQuery += `&tag=${encodeURIComponent(uniqueTag)}`;
        const url = `${urlBase}/articles${urlQuery}`;

        function reqListener() {
            if (this.status === 200) {
                const responseJSON = JSON.parse(this.responseText);

                //totalCount isnt provided,length of the articles
                const totalArticles = totalCount > 0 ? totalCount : responseJSON.meta.totalCount || responseJSON.articles.length;

                addArtDetailLink2ResponseJson(responseJSON);

                const articles = responseJSON.articles;
                const promises = articles.map(article => 
                    fetch(`${urlBase}/article/${article.id}`)
                        .then(response => response.json())
                        .then(fullArticle => {
                            article.content = fullArticle.content;
                            return article;
                        })
                );

                Promise.all(promises).then(updatedArticles => {
                    responseJSON.articles = updatedArticles;

                    //if new article += to the articles list
                    if (newArticle) {
                        responseJSON.articles.unshift(newArticle);
                    }

                    responseJSON.showPrevious = offset > 0;
                    responseJSON.showNext = (offset + articlesPerPage) < totalArticles;
                    responseJSON.previousOffset = Math.max(0, offset - articlesPerPage);
                    responseJSON.nextOffset = offset + articlesPerPage;
                    responseJSON.totalCount = totalArticles;

                    document.getElementById(targetElm).innerHTML =
                        Mustache.render(
                            document.getElementById("template-articles").innerHTML,
                            responseJSON
                        );
                });
            } else{
                const errMsgObj = { errMessage: this.responseText };
                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-articles-error").innerHTML,
                        errMsgObj
                    );
            }
        }

        const ajax = new XMLHttpRequest();
        ajax.addEventListener("load", reqListener);
        ajax.open("GET", url, true);
        ajax.send();
    }


    //---------------DELETE ARTICLE---------------

    function deleteArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
        const url = `${urlBase}/article/${artIdFromHash}`;

        function reqListener() {
            console.log("Server response:", this.responseText); 
            console.log("Status code:", this.status);
            
            if (this.status == 200 || this.status == 204) {
                alert("Article deleted successfully!");
                window.location.hash = `#articles/${offsetFromHash}/${totalCountFromHash}`; 
                fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash);
            } else {
                console.error("Error deleting article: ", this.responseText); 
                const errMsgObj = { errMessage: this.responseText };
                document.getElementById(targetElm).innerHTML = Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
            }
        }

        if (confirm("Are you sure you want to delete this article?")) {
            var ajax = new XMLHttpRequest();
            ajax.addEventListener("load", reqListener);
            ajax.open("DELETE", url, true);
            ajax.send();
        }

    }



    function addArtDetailLink2ResponseJson(responseJSON){
        responseJSON.articles = responseJSON.articles.map(
            article =>(
            {
                ...article,
                detailLink:`#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
            }
            )
        );
    }                                      

    function fetchAndDisplayArticleDetail(targetElm,artIdFromHash,offsetFromHash,totalCountFromHash) {
        fetchAndProcessArticle(...arguments,false);
    }                   



    function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
        fetchAndProcessArticle(...arguments,true);
    }     

    //---------------PROCESS ARTICLE---------------
    function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash, forEdit) {
        const url = `${urlBase}/article/${artIdFromHash}`;

        function reqListener() {
        
        console.log(this.responseText)
        if (this.status == 200) {
            const responseJSON = JSON.parse(this.responseText)
            if (forEdit) {
                responseJSON.formTitle = "Edit Article";
                responseJSON.submitBtTitle = "Save Article";
                responseJSON.backLink = `#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;
            
                document.getElementById(targetElm).innerHTML = Mustache.render(
                    document.getElementById("template-article-form").innerHTML,
                    responseJSON
                );
            
                //update author
                const authorField = document.getElementById("author");
                if (loggedInUser) {
                    authorField.value = loggedInUser; 
                } else {
                    authorField.value = ""; //empty if logged out
                }

                if (!window.artFrmHandler) {
                    window.artFrmHandler = new articleFormsHandler("https://wt.kpi.fei.tuke.sk/api");
                }
                window.artFrmHandler.assignFormAndArticle("articleForm", "hiddenElm", artIdFromHash, offsetFromHash, totalCountFromHash);
            }else {
                    responseJSON.backLink = `#articles/${offsetFromHash}/${totalCountFromHash}`;
                    responseJSON.editLink = `#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                    responseJSON.deleteLink = `#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

                    document.getElementById(targetElm).innerHTML = Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );

                    //comments
                    const existingComments = JSON.parse(localStorage.getItem(`comments-${artIdFromHash}`)) || [];
                    let offset = 0;
                    const limit = 10;

                    renderComments(existingComments, offset, limit);

                    //pagination comments
                    document.getElementById("prevBtn").onclick = function () {
                        offset = Math.max(0, offset - limit);
                        renderComments(existingComments, offset, limit);
                    };

                    document.getElementById("nextBtn").onclick = function () {
                        if (offset + limit < existingComments.length) {
                            offset += limit;
                            renderComments(existingComments, offset, limit);
                        }
                    };

                    //-------ADD COMMENT------
                    const commentForm = document.getElementById("add-comment-form");
                    const addCommentBtn = document.getElementById("add-comment-btn");
                    //visibility btn
                    if (addCommentBtn) {
                        addCommentBtn.onclick = function () {
                            commentForm.classList.toggle("hiddenElm");
                            
                            //fill author with logged-in name
                            if (!commentForm.classList.contains("hiddenElm")) {
                                document.getElementById('comment-author').value = loggedInUser || '';
                            }
                        };
                    }
                    

                    if (commentForm) {
                        commentForm.onsubmit = function (e) {
                            e.preventDefault();
                            const author = document.getElementById("comment-author").value || "Anonymous";
                            const content = document.getElementById("comment-content").value;
                    
                            const newComment = { author, content, date: new Date().toISOString() };
                    
                            //save new comment in storage
                            existingComments.push(newComment);
                            localStorage.setItem(`comments-${artIdFromHash}`, JSON.stringify(existingComments));

                            renderComments(existingComments, offset, limit);
                    
                            commentForm.reset();
                        };
                    }
                    
                }
            } else{
                const errMsgObj = { errMessage: this.responseText };
                document.getElementById(targetElm).innerHTML = Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
            }
        }

        var ajax = new XMLHttpRequest();
        ajax.addEventListener("load", reqListener);
        ajax.open("GET", url, true);
        ajax.send();
    }

    //render comments
    function renderComments(comments, offset = 0, limit = 10) {
        const paginatedComments = comments.slice(offset, offset + limit);
        const hasNext = offset + limit < comments.length;
        const hasPrev = offset > 0;

        document.getElementById("comments-container").innerHTML = Mustache.render(
            "{{#comments}}<div class='comment'><strong>{{author}}</strong> <em>{{date}}</em><p>{{content}}</p></div>{{/comments}}",
            { comments: paginatedComments }
        );

        //pagination btns
        document.getElementById("prevBtn").classList.toggle("hiddenElm", !hasPrev);
        document.getElementById("nextBtn").classList.toggle("hiddenElm", !hasNext);
    }

    function handleAddCommentFormSubmit(event, artIdFromHash) {
        event.preventDefault();
        const content = form.querySelector("[name='content']").value.trim();
        const author = form.querySelector("[name='author']").value.trim() || "Anonymous";

        if (!content) {
            alert("Please enter a comment.");
            return;
        }

        const commentData = {
            content,
            author
        };

        //add comment
        fetch(`${urlBase}/article/${artIdFromHash}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(commentData)
        })
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error("Failed to add the comment.");
        })
        .then(() => {
            alert("Comment added successfully!");
            //reload comments after adding
            fetchAndDisplayArticleComments("comments-container", artIdFromHash, 0, 10);
            form.reset();
        })
        .catch((error) => {
            console.error("Error adding comment:", error);
            alert("Failed to add comment. Please try again.");
        });
    }

    function fetchAndDisplayArticleComments(targetElm, artIdFromHash, offset = 0, limit = 10) {
        fetch(`${urlBase}/article/${artIdFromHash}/comments?offset=${offset}&limit=${limit}`)
            .then(response => response.json())
            .then(data => {
                renderComments(data.comments, offset, limit);

                document.getElementById("prevBtn").onclick = function () {
                    fetchAndDisplayArticleComments(targetElm, artIdFromHash, Math.max(0, offset - limit), limit);
                };
                document.getElementById("nextBtn").onclick = function () {
                    if (data.comments.length === limit) {
                        fetchAndDisplayArticleComments(targetElm, artIdFromHash, offset + limit, limit);
                    }
                };
            })
        .catch(error => console.error("Failed to fetch comments:", error));
    }