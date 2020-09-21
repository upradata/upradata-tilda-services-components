import { Term } from '@upradata/tilda-tools/lib/src/terms/terms.types';
//  not obliged because of the global typing. But vscode needs to have the file open to not highlight an error :(
// import { MT } from '../../typings/mt';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../../services/loading-animation-popup.service';
import { Api } from '../../utils/api';
import { buildTerm } from './build-term';
import { servicesPromise$ } from '@upradata/browser-util';
import { MtModuleServices } from '../../services/all-services';


// declare const mt: MT;

export class PolicyOptions {
    api: Api;
    loadingAnimation?: Partial<LoadingAnimationPopupOptions>;
    htmlCodeId: string;

    constructor(options: PolicyOptions) {
        this.api = new Api(options.api);
        this.htmlCodeId = options.htmlCodeId;

        this.loadingAnimation = Object.assign({
            loadingMessage: `Loading "Privacy Policy". Be patient while the network is responding`,
            errorMessage: `An error occured. We could not load "Privacy Policy".`
        }, options.loadingAnimation, { autoShow: true, autoClose: true, });
    }
}

export class Policy {
    public options: PolicyOptions;
    private loadingAnimation: LoadingAnimationPopup;

    constructor(options: PolicyOptions) {
        servicesPromise$<MtModuleServices>().then(() => {

            this.options = new PolicyOptions(options);

            // const popup = document.querySelector('#rec108186637 .t-popup__container'); // popup on the client already

            // const popup = new mt.Popup({ recid: mt.Popup.globalPopupRecId });
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
                this.loadingAnimation.startLoadingAnimation({ delay: 500 });
                $.ajax(ajaxSettings);
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
            const htmlEl = document.querySelector(this.options.htmlCodeId);

            htmlEl.innerHTML = '';
            htmlEl.appendChild(termElement);
            init();
        } catch (e) {
            this.loadingAnimation.onError();
            console.error(e);
        }

        this.loadingAnimation.stopLoadingAnimation();
    }
}
