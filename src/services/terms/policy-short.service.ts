import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../loading-animation-popup.service';
import { Api } from '../../utils';
import { Popup } from '../../components';
import { MT } from '../../typings/mt';


declare const mt: MT; // for build-scripts-streams to compile (apparently running ts programatically does not understand global ambiant declaration)
declare function t668_init(s: string);

export class PolicyShortOptions {
    api: Api;
    loadingAnimation?: Partial<LoadingAnimationPopupOptions>;

    constructor(options: PolicyShortOptions) {
        this.api = new Api(options.api);

        const loadingAnimation = Object.assign({
            loadingMessage: `Loading "Privacy Policy". Be patient while the network is responding`,
            errorMessage: `An error occured. We could not load "Privacy Policy".`
        }, options.loadingAnimation, { autoShow: true, autoClose: true, });

        this.loadingAnimation = new mt.LoadingAnimationPopupOptions(loadingAnimation);
    }
}

export class PolicyShort {
    public options: PolicyShortOptions;
    private popup: Popup;
    private loadingAnimation: LoadingAnimationPopup;
    private shortPolicyDiv: HTMLElement = undefined;

    constructor(options: PolicyShortOptions) {
        this.options = new PolicyShortOptions(options);

        // const popup = document.querySelector('#rec108186637 .t-popup__container'); // popup on the client already

        this.popup = new mt.Popup({ recid: mt.Popup.globalPopupRecId });
        this.loadingAnimation = new mt.LoadingAnimationPopup({ popup: this.popup, ...this.options.loadingAnimation });

        const { api } = this.options;
        const url = location.href.includes('192.168.0') || location.href.includes('localhost') ? `http://localhost:8080/${api.url}` : `${api.domain}/${api.url}`;

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

                if (!this.shortPolicyDiv) {
                    // loadingAnimation.startLoadingAnimation({ delay: 500 }).then(() => popup.showPopup());
                    this.loadingAnimation.startLoadingAnimation({ delay: 500 });

                    $.ajax(ajaxSettings);
                } else
                    this.popup.append(this.shortPolicyDiv);

            });
        });
    }

    private onError(jqXHR: JQuery.jqXHR, textStatus: JQuery.Ajax.ErrorTextStatus, errorThrown: string) {
        this.loadingAnimation.onError();
        console.error('Error occured: ', { textStatus, errorThrown });
    }


    private onSuccess(html: string, textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR) {
        try {
            this.shortPolicyDiv = document.createElement('div');
            this.shortPolicyDiv.innerHTML = html;
            this.shortPolicyDiv.classList.add('mt-short-policy-loaded');
            this.popup.clear();
            this.popup.append(this.shortPolicyDiv);

            t668_init('mtpopuptlist'); // init FAQ list
        } catch (e) {
            this.loadingAnimation.stopLoadingAnimation();
            console.error(e);
        }
        finally {
            this.loadingAnimation.stopLoadingAnimation();
        }
    }
}


new PolicyShort({
    api: {
        url: 'api/legal/upradata-policy',
        domain: 'https://server.upradata.com/static/html/upradata-policy-short.server.html'
    },
    loadingAnimation: {
        loadingMessage: `Loading digital.upradata.com "Privacy Policy". Be patient while the network is responding`,
        // tslint:disable-next-line: max-line-length
        errorMessage: `<p>An error occured. We could not load digital.upradata.com "Privacy Policy". Please, contact <a href="mailto:bug@upradata.com">bug@upradata.com</a> to help us fix the issue.</p>`
    }
});
