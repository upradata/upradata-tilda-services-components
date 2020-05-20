import { Term } from '@upradata/tilda-tools/lib/terms/terms.types';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../loading-animation-popup.service';
import { Api } from '../../utils/api';
import { Popup } from '../../components/popup.component';
import { MT } from '../../typings/mt';
import { buildTerm } from './build-term';

declare const mt: MT; // for build-scripts-streams to compile (apparently running ts programatically does not understand global ambiant declaration)

export class PolicyShortOptions {
    api: Api;
    loadingAnimation?: Partial<LoadingAnimationPopupOptions>;

    constructor(options: PolicyShortOptions) {
        this.api = new Api(options.api);

        this.loadingAnimation = Object.assign({
            loadingMessage: `Loading "Privacy Policy". Be patient while the network is responding`,
            errorMessage: `An error occured. We could not load "Privacy Policy".`
        }, options.loadingAnimation, { autoShow: true, autoClose: true, });
    }
}

export class PolicyShort {
    public options: PolicyShortOptions;
    private popup: Popup;
    private loadingAnimation: LoadingAnimationPopup;
    private mtTildaTermEl: HTMLMtTildaTermElement = undefined;

    constructor(options: PolicyShortOptions) {
        this.options = new PolicyShortOptions(options);

        // const popup = document.querySelector('#rec108186637 .t-popup__container'); // popup on the client already

        this.popup = new mt.Popup({ recid: mt.Popup.globalPopupRecId });
        this.loadingAnimation = new mt.LoadingAnimationPopup({ popup: this.popup, ...this.options.loadingAnimation });

        const { api } = this.options;
        const url = location.href.includes('192.168.0') || location.href.includes('localhost') ? `http://localhost:${api.devPort}/${api.url}` : `${api.domain}/${api.url}`;

        const ajaxSettings: JQuery.AjaxSettings = {
            crossDomain: true,
            url,
            method: 'GET',
            dataType: 'html',
            success: this.onSuccess.bind(this),
            error: this.onError.bind(this)
        };

        $(window).ready(() => {

            const linkToPopup = document.querySelector(`[href="${mt.Popup.linkId}"]`);
            linkToPopup.addEventListener('click', e => {
                e.preventDefault();
                this.popup.showPopup();

                if (!this.mtTildaTermEl) {
                    // loadingAnimation.startLoadingAnimation({ delay: 500 }).then(() => popup.showPopup());
                    this.loadingAnimation.startLoadingAnimation({ delay: 500 });

                    $.ajax(ajaxSettings);
                } else
                    this.popup.append(this.mtTildaTermEl);

            });
        });
    }

    private onError(jqXHR: JQuery.jqXHR, textStatus: JQuery.Ajax.ErrorTextStatus, errorThrown: string) {
        this.loadingAnimation.onError();
        console.error('Error occured: ', { textStatus, errorThrown });
    }


    private onSuccess(term: Term, textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR) {
        try {
            this.mtTildaTermEl = buildTerm(term);
            this.mtTildaTermEl.classList.add('mt-short-policy-loaded');

            this.popup.clear();
            this.popup.append(this.mtTildaTermEl);
        } catch (e) {
            this.loadingAnimation.onError();
            console.error(e);
        }

        this.loadingAnimation.stopLoadingAnimation();
    }
}
