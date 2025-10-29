/**
 * Class for  handling a list (an array) of visitor opinions in local storage
 * The list is filled from a form and rendered to html
 * A template literal is used to render the opinions list
 * @author Stefan Korecko (2021)
 * 
 * 
 * 
 */
export default function processOpnFrmData(event){
    event.preventDefault();

    const form = event.target;

    const nopName = form.elements["opnElm"].value.trim() || loggedInUser || "Anonymous";
    const nopOpn = form.elements["nopOpn"].value.trim() || loggedInUserEmail || "no-email@example.com";
    const nopFeedback = form.elements["feedback"].value.trim();
    const nopWillReturn = form.elements["willReturnElm"].checked;
    const nopPicture = form.elements["picture"].value.trim() || "fig/profile.png";

    if(nopName=="" || nopOpn==""||nopFeedback === ""){
        window.alert("Please, enter both your name and opinion");
        return;
    }
    if (!nopPicture) {
        nopPicture = "fig/profile.png";
    }

    //add the data to opinions and storage
    const newOpinion =
        {
            name: nopName,
            email: nopOpn,
            comment: nopFeedback,
            willReturn: nopWillReturn,
            created: new Date(),
            picture: nopPicture,
            
        };

        let opinions = [];

    if(localStorage.myTreesComments){
        opinions=JSON.parse(localStorage.myTreesComments);
    }

    opinions.push(newOpinion);
    localStorage.myTreesComments = JSON.stringify(opinions);


    //go to opinions
    window.location.hash="#opinions";

}





