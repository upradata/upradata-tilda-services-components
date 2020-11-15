import { MtModulesServices, servicesPromise$ } from './../../services/global/services.module';
import { Term } from '@upradata/tilda-tools/lib/terms/terms.types';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../../services/global/loading-animation-popup.service';
import { Api } from '../../utils/api';
// import { Popup } from '../../services/popup.service';
// import { MT } from '../../typings/mt';
import { buildTerm } from './build-term';
import { services } from '../../services/global/services.module';
import { TermComponent, TermComponentOptions } from './term';
// import { servicesPromise$ } from '../../services/global/load-services';
// import { EVENTS } from '../../services/global/load-services.event';


// declare const mt: MT; // for build-scripts-streams to compile (apparently running ts programatically does not understand global ambiant declaration)

export interface PolicyShortOptions extends TermComponentOptions {
    api: Api;
    loadingAnimation?: Partial<LoadingAnimationPopupOptions>;
    popupLinkId: string;

}

export class PolicyShort extends TermComponent {
    private mtTildaTermEl: HTMLMtTildaTermElement = undefined;
    public popupLinkId: string;

    constructor(options: PolicyShortOptions) {
        super({ ...options, name: 'Privacy Policy' });
    }

    protected init() {
        servicesPromise$().then(services => {
            const linkToPopup = document.querySelector(`[href="${this.popupLinkId}"]`);

            if (!linkToPopup) {
                console.error(`Cannot find the <a> link to open the short policy popup '[href="${this.popupLinkId}"]'`);
                return;
            }

            linkToPopup.addEventListener('click', e => {
                e.preventDefault();
                services.tildaGlobal.popup.showPopup();

                if (!this.mtTildaTermEl) {
                    this.sendAjaxRequest();
                } else {
                    // every time the popup is closed, mtTildaTermEl is removed from the popup content
                    // so it is detached and we have to re-init it (init is calling tilda t688_init)
                    services.tildaGlobal.popup.append(this.mtTildaTermEl);
                    this.mtTildaTermEl.init(true);
                }
            });
        });
    }

    protected async onSuccess(term: Term, textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR) {
        try {
            const { termElement, init } = buildTerm(term);

            this.mtTildaTermEl = termElement;
            this.mtTildaTermEl.classList.add('mt-short-policy-loaded');

            services.popup.clear();
            services.popup.append(this.mtTildaTermEl);
            await init({ isPopup: true, noHeader: true }).then(() => termElement.init());
        } catch (e) {
            this.loadingAnimation.onError();
            console.error(e);
        }

        this.loadingAnimation.stopLoadingAnimation();
    }
}
