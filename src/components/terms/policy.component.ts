import { Term } from '@upradata/tilda-tools/lib/terms/terms.types';
//  not obliged because of the global typing. But vscode needs to have the file open to not highlight an error :(
// import { MT } from '../../typings/mt';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../../services/global/loading-animation-popup.service';
import { Api } from '../../utils/api';
import { buildTerm } from './build-term';
import { TermComponent, TermComponentOptions } from './term';
// import { MtModuleServices } from '../../services/all-services';


// declare const mt: MT;


export class Policy extends TermComponent {
    constructor(options: TermComponentOptions) {
        super({ ...options, name: 'Privacy Policy' });
    }

    protected init() {
        this.sendAjaxRequest();
    }

    protected async onSuccess(term: Term, textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR) {
        try {
            const { termElement, init } = buildTerm(term);
            const htmlEl = document.querySelector(this.htmlCodeId);

            htmlEl.innerHTML = '';
            htmlEl.appendChild(termElement);
            await init();
        } catch (e) {
            this.loadingAnimation.onError();
            console.error(e);
        }

        this.loadingAnimation.stopLoadingAnimation();
    }
}
