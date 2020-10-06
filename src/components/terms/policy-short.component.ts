import { MtModulesServices, servicesPromise$ } from './../../services/global/services.module';
import { Term } from '@upradata/tilda-tools/lib/src/terms/terms.types';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../../services/global/loading-animation-popup.service';
import { Api } from '../../utils/api';
// import { Popup } from '../../services/popup.service';
// import { MT } from '../../typings/mt';
import { buildTerm } from './build-term';
import { services } from '../../services/global/services.module';
// import { servicesPromise$ } from '../../services/global/load-services';
// import { EVENTS } from '../../services/global/load-services.event';


// declare const mt: MT; // for build-scripts-streams to compile (apparently running ts programatically does not understand global ambiant declaration)

export class PolicyShortOptions {
    api: Api;
    loadingAnimation?: Partial<LoadingAnimationPopupOptions>;

    constructor(options: PolicyShortOptions) {
        this.api = new Api(options.api);

        this.loadingAnimation = Object.assign({
            loadingMessage: `Loading "Privacy Policy". Be patient while the network is responding`,
            errorMessage: `An error occured. We could not load "Privacy Policy".`
        }, options.loadingAnimation, { autoShow: true, autoClose: false, });
    }
}

export class PolicyShort {
    public options: PolicyShortOptions;
    // private popup: Popup;
    private loadingAnimation: LoadingAnimationPopup;
    private mtTildaTermEl: HTMLMtTildaTermElement = undefined;

    constructor(options: PolicyShortOptions) {
        this.options = new PolicyShortOptions(options);

        // const popup = document.querySelector('#rec108186637 .t-popup__container'); // popup on the client already

        // this.popup = new mt.Popup({ recid: mt.Popup.globalPopupRecId });
        this.loadingAnimation = new LoadingAnimationPopup(this.options.loadingAnimation);

        const { api } = this.options;
        const url = location.href.includes('192.168.0') || location.href.includes('localhost') ? `http://localhost:${api.devPort}/${api.url}` : `${api.domain}/${api.url}`;

        const ajaxSettings: JQuery.AjaxSettings = {
            crossDomain: true,
            url,
            method: 'GET',
            dataType: 'json',
            success: (...args) => this.onSuccess.apply(this, args),
            error: this.onError.bind(this)
        };

        $(window).ready(() => {
            servicesPromise$().then(services => {
                const linkToPopup = document.querySelector(`[href="${/* mt.Popup */services.tildaGlobal.popup.options.linkId}"]`);
                linkToPopup.addEventListener('click', e => {
                    e.preventDefault();
                    services.tildaGlobal.popup.showPopup();

                    if (!this.mtTildaTermEl) {
                        this.loadingAnimation.startLoadingAnimation({ delay: 500 });
                        $.ajax(ajaxSettings);
                    } else {
                        // every time the popup is closed, mtTildaTermEl is removed from the popup content
                        // so it is detached and we have to re-init it (init is calling tilda t688_init)
                        services.tildaGlobal.popup.append(this.mtTildaTermEl);
                        this.mtTildaTermEl.init(true);
                    }
                });
            });
        });
    }

    private onError(jqXHR: JQuery.jqXHR, textStatus: JQuery.Ajax.ErrorTextStatus, errorThrown: string) {
        this.loadingAnimation.onError();
        console.error('Error occured: ', { textStatus, errorThrown });
    }


    private async onSuccess(term: Term, textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR) {
        try {
            const { termElement, init } = buildTerm(term);

            this.mtTildaTermEl = termElement;
            this.mtTildaTermEl.classList.add('mt-short-policy-loaded');

            services.popup.clear();
            services.popup.append(this.mtTildaTermEl);
            init({ isPopup: true, noHeader: true }).then(() => termElement.init());
        } catch (e) {
            this.loadingAnimation.onError();
            console.error(e);
        }

        this.loadingAnimation.stopLoadingAnimation();
    }
}
