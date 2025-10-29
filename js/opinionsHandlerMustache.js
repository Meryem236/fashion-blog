
import OpinionsHandler from "./opinionsHandler.js";
import Mustache from "./mustache.js";

export default class OpinionsHandlerMustache extends OpinionsHandler{

    constructor(opinionsFormElmId, opinionsListElmId,templateElmId) {

        //call the constructor from the superclass:
        super(opinionsFormElmId, opinionsListElmId);

        //get the template:
        this.mustacheTemplate=document.getElementById("template-opinions").innerHTML;
    }

    opinion2html(opinion){
        opinion.picture = opinion.picture || "fig/profile.png";
        opinion.willReturn = opinion.willReturn ? "I would visit again." : "I wouldn't visit again.";
        //opinion.keywordlist = opinion.keywordlist;
        opinion.comment;
        //in the case of Mustache, we must prepare data beforehand:
        opinion.createdDate=(new Date(opinion.created)).toDateString();

        //use the Mustache:
        const htmlWOp = Mustache.render(this.mustacheTemplate,opinion);

        //delete the createdDate item as we created it only for the template rendering:
        delete(opinion.createdDate);

        //return the rendered HTML:
        return htmlWOp;
    }
}
	