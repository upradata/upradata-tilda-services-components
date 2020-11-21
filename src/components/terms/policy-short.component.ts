import { Term } from '@upradata/tilda-tools/lib/terms/terms.types';
import { MT } from '../../typings/mt';
import { buildTerm } from './build-term';
import { TermComponent, TermComponentOptions } from './term';

// declare const mt: MT; // for build-scripts-streams to compile (apparently running ts programatically does not understand global ambiant declaration)

export interface PolicyShortOptions extends TermComponentOptions {
    popupLinkId: string;
}

export class PolicyShort extends TermComponent {
    private mtTildaTermEl: HTMLMtTildaTermElement = undefined;
    public popupLinkId: string;

    constructor(options: PolicyShortOptions) {
        super({ ...options, loadingAnimation: { autoClose: false }, name: 'Privacy Policy' });
        this.popupLinkId = options.popupLinkId;
        this.init();
    }

    protected doInit() {

        const linkToPopup = document.querySelector(`[href="${this.popupLinkId}"]`);

        if (!linkToPopup) {
            console.error(`Cannot find the <a> link to open the short policy popup '[href="${this.popupLinkId}"]'`);
            return;
        }

        linkToPopup.addEventListener('click', e => {
            e.preventDefault();
            mt.services.tilda.popup.showPopup();

            if (!this.mtTildaTermEl) {
                this.sendAjaxRequest();
            } else {
                // every time the popup is closed, mtTildaTermEl is removed from the popup content
                // so it is detached and we have to re-init it (init is calling tilda t688_init)
                mt.services.tilda.popup.append(this.mtTildaTermEl);
                this.mtTildaTermEl.init(true);
            }
        });
    }

    protected async onSuccess(term: Term, textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR) {
        try {
            const { termElement, init } = buildTerm(term);

            this.mtTildaTermEl = termElement;
            this.mtTildaTermEl.classList.add('mt-short-policy-loaded');

            mt.services.tilda.popup.clear();
            mt.services.tilda.popup.append(this.mtTildaTermEl);
            await init({ isPopup: true, noHeader: true }).then(() => termElement.init());
        } catch (e) {
            this.loadingAnimation.onError();
            console.error(e);
        }

        this.loadingAnimation.stopLoadingAnimation();
    }
}
