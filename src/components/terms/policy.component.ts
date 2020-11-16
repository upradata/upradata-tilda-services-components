import { Term } from '@upradata/tilda-tools/lib/terms/terms.types';
//  not obliged because of the global typing. But vscode needs to have the file open to not highlight an error :(
// import { MT } from '../../typings/mt';
import { buildTerm } from './build-term';
import { TermComponent, TermComponentOptions } from './term';
// import { MtModuleServices } from '../../services/all-services';


// declare const mt: MT;
export type PolicyOptions = TermComponentOptions;

export class Policy extends TermComponent {
    constructor(options: PolicyOptions) {
        super({ ...options, name: 'Privacy Policy' });
        this.init();
    }

    protected doInit() {
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
