import { fetchAndDisplayArticles } from './routes.js';

export default class articleFormsHandler {
    constructor(articlesServerUrl,fetchArticlesFunction) {
        this.serverUrl = articlesServerUrl;
        this.fetchArticlesFunction = fetchArticlesFunction;
    }

    assignFormAndArticle(formElementId, cssClass2hideElement, articleId, offset, totalCount) {
        this.cssCl2hideElm = cssClass2hideElement;
        const artForm = document.getElementById(formElementId);

    

        this.formElements = artForm.elements;
        if (typeof articleId === "string") {
            this.articleId = Number(articleId);
        } else {
            this.articleId = articleId;
        }
        
        this.formElements.namedItem('btShowFileUpload').onclick = () => this.showFileUpload();
        this.formElements.namedItem('btFileUpload').onclick = () => this.uploadImg();
        this.formElements.namedItem('btCancelFileUpload').onclick = () => this.cancelFileUpload();

        if (articleId >= 0) {
            artForm.onsubmit = (event) => this.processArtEditFrmData(event);
            this.articleId = articleId;
            this.offset = offset;
            this.totalCount = totalCount;
        } else {
            artForm.onsubmit = (event) => this.processNewArticleFrmData(event);
        }
    }

    showFileUpload(event) {
        this.formElements.namedItem('fsetFileUpload').classList.remove(this.cssCl2hideElm);
        this.formElements.namedItem('btShowFileUpload').classList.add(this.cssCl2hideElm);
    }

    cancelFileUpload() {
        this.formElements.namedItem('fsetFileUpload').classList.add(this.cssCl2hideElm);
        this.formElements.namedItem('btShowFileUpload').classList.remove(this.cssCl2hideElm);
    }

    uploadImg() {
        const files = this.formElements.namedItem("flElm").files;

        if (files.length > 0) {
            const imgLinkElement = this.formElements.namedItem("imageLink");
            const fieldsetElement = this.formElements.namedItem("fsetFileUpload");
            const btShowFileUploadElement = this.formElements.namedItem("btShowFileUpload");

            let imgData = new FormData();
            imgData.append("file", files[0]);

            const postReqSettings = {
                method: 'POST',
                body: imgData
            };

            fetch(`${this.serverUrl}/fileUpload`, postReqSettings)
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
                    }
                })
                .then(responseJSON => {
                    imgLinkElement.value = responseJSON.fullFileUrl;
                    btShowFileUploadElement.classList.remove(this.cssCl2hideElm);
                    fieldsetElement.classList.add(this.cssCl2hideElm);
                })
                .catch(error => {
                    window.alert(`Image uploading failed. ${error}.`);
                });
        } else {
            window.alert("Please, choose an image file.");
        }
    }

    processArtEditFrmData(event) {
        event.preventDefault();
    
        const currentAuthor = this.formElements.namedItem("author").value.trim();
        const updatedAuthor = loggedInUser || currentAuthor; //logged-in info or current author
    
        const articleData = {
            title: this.formElements.namedItem("title").value.trim(),
            content: this.formElements.namedItem("content").value.trim(),
            author: updatedAuthor, 
            imageLink: this.formElements.namedItem("imageLink").value.trim(),
            tags: this.formElements.namedItem("tags").value.trim()
        };
    
        if (!(articleData.title && articleData.content)) {
            window.alert("Please, enter both the article title and content.");
            return;
        }

        if (!articleData.imageLink) {
            delete articleData.imageLink;
        }
    
        if (!articleData.tags) {
            delete articleData.tags;
        } else {
            articleData.tags = articleData.tags.split(",").map(tag => tag.trim()).filter(tag => tag);
            if (articleData.tags.length === 0) {
                delete articleData.tags;
            }
        }
    
        const postReqSettings = {
            method: "PUT",
            headers: {
                "Content-Type": "application/json;charset=utf-8",
            },
            body: JSON.stringify(articleData)
        };
    
        fetch(`${this.serverUrl}/article/${this.articleId}`, postReqSettings)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    return Promise.reject(new Error(`Server responded with ${response.status}: ${response.statusText}`));
                }
            })
            .then(responseJSON => {
                window.alert("Updated article successfully saved on the server.");
            })
            .catch(error => {
                window.alert(`Failed to save the updated article on the server. ${error}`);
            })
            .finally(() => {
                //back to the article view
                window.location.hash = `#article/${this.articleId}/${this.offset}/${this.totalCount}`;
            });
    }
    

    //---------NEW ARTICLE-------------
    processNewArticleFrmData(event) {
        event.preventDefault();
    
        const articleData = {
            title: this.formElements.namedItem("title").value.trim(),
            content: this.formElements.namedItem("content").value.trim(),
            author: this.formElements.namedItem("author").value.trim() || loggedInUser || "Anonymous", // Auto-fill author
            imageLink: this.formElements.namedItem("imageLink").value.trim(),
            tags: this.formElements.namedItem("tags").value.trim()
        };
    
        const uniqueTag = 'Fabricea';
        if (articleData.tags) {
            articleData.tags = articleData.tags.split(",").map(tag => tag.trim());
        } else {
            articleData.tags = [];
        }
        articleData.tags.push(uniqueTag);
        articleData.tags = articleData.tags.filter(tag => tag);
    
        if (!(articleData.title && articleData.content)) {
            window.alert("Please, enter article title and content");
            return;
        }
    
        if (!articleData.author) {
            articleData.author = "Anonymous";
        }
    
        if (!articleData.imageLink) {
            delete articleData.imageLink;
        }
    
        if (articleData.tags.length == 0) {
            delete articleData.tags;
        }
    
        const postReqSettings = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
            },
            body: JSON.stringify(articleData)
        };
    
        fetch(`${this.serverUrl}/articles`, postReqSettings)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
                }
            }) 
            .then(responseJSON => {
                window.alert("New article successfully saved on server");
    
                //clear the form 
                this.formElements.namedItem("title").value = '';
                this.formElements.namedItem("content").value = '';
                this.formElements.namedItem("author").value = '';
                this.formElements.namedItem("imageLink").value = '';
                //this.formElements.namedItem("tags").value = '';
    
                //smoothly to the top
                window.scrollTo({ top: 0, behavior: 'smooth' });
    
                
                const newArticle = {
                    id: responseJSON.id, 
                    title: responseJSON.title,
                    content: responseJSON.content,
                    author: responseJSON.author,
                    imageLink: responseJSON.imageLink,
                    tags: responseJSON.tags,
                    detailLink: `#article/${responseJSON.id}/0/0` 
                };
    
                const articlesContainer = document.getElementById("router-view"); 
                const articlesTemplate = document.getElementById("template-articles").innerHTML;
    
                articlesContainer.innerHTML = Mustache.render(articlesTemplate, {
                    articles: [newArticle], 
                    showPrevious: false,
                    showNext: false,
                    previousOffset: 0,
                    nextOffset: 0,
                    totalCount: 1 
                });
    
                fetchAndDisplayArticles("router-view", 0, 0);
            })
            .catch(error => {
                window.alert(`Failed to save the new article on server. ${error}`);
            });
    }
    
}

document.getElementById('btAddArticle').addEventListener('click', function() {
    const formContainer = document.getElementById('formContainer');
    const template = document.getElementById('template-article-form').innerHTML;

    //if form visible 
    if (formContainer.classList.contains('hiddenElm')) {
        
        const formHTML = template
        .replace('{{author}}', loggedInUser || '') //fill author if logged in
        .replace('{{title}}', '')
        .replace('{{imageLink}}', '')
        .replace('{{content}}', '')
        .replace('{{tags}}', '')
        .replace('{{submitBtTitle}}', 'Add Article');
    
    formContainer.innerHTML = formHTML;
    
        formContainer.classList.remove('hiddenElm');

        const articleFormHandler = new articleFormsHandler('https://wt.kpi.fei.tuke.sk/api', fetchAndDisplayArticles);
        articleFormHandler.assignFormAndArticle('articleForm', 'hiddenElm', -1, 0, 0); 
    } else {
        formContainer.classList.add('hiddenElm');
    }
});

