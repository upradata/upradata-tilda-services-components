import { Terms } from '@upradata/tilda-tools';
import { createList } from './list.client';
//  not obliged because of the global typing. But vscode needs to have the file open to not highlight an error :(
import { MT } from '../../typings/mt';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../loading-animation-popup.service';
import { Api } from '../../utils';


declare const mt: MT;
declare function t668_init(s: string);

export class PolicyOptions {
    api: Api;
    loadingAnimation?: Partial<LoadingAnimationPopupOptions>;

    constructor(options: PolicyOptions) {
        this.api = new Api(options.api);

        const loadingAnimation = Object.assign({
            loadingMessage: `Loading "Privacy Policy". Be patient while the network is responding`,
            errorMessage: `An error occured. We could not load "Privacy Policy".`
        }, options.loadingAnimation, { autoShow: true, autoClose: true, });

        this.loadingAnimation = new mt.LoadingAnimationPopupOptions(loadingAnimation);
    }
}

export class Policy {
    public options: PolicyOptions;
    private loadingAnimation: LoadingAnimationPopup;

    constructor(options: PolicyOptions) {
        this.options = new PolicyOptions(options);

        // const popup = document.querySelector('#rec108186637 .t-popup__container'); // popup on the client already

        const popup = new mt.Popup({ recid: mt.Popup.globalPopupRecId });
        this.loadingAnimation = new mt.LoadingAnimationPopup({ popup, ...this.options.loadingAnimation });

        const { api } = this.options;
        const url = location.href.includes('192.168.0') || location.href.includes('localhost') ? `http://localhost:8080/${api.url}` : `${api.domain}/${api.url}`;

        const ajaxSettings: JQuery.AjaxSettings = {
            crossDomain: true,
            url,
            method: 'GET',
            dataType: 'json',
            success: this.onSuccess.bind(this),
            error: this.onError.bind(this)
        };


        $(window).ready(() => {
            this.loadingAnimation.startLoadingAnimation({ delay: 500 });
            $.ajax(ajaxSettings);
        });
    }

    private onError(jqXHR: JQuery.jqXHR, textStatus: JQuery.Ajax.ErrorTextStatus, errorThrown: string) {
        this.loadingAnimation.onError();
        console.error('Error occured: ', { textStatus, errorThrown });
    }


    private onSuccess(terms: Terms, textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR) {
        try {
            const termTitle = document.querySelector('#mt-term-title');
            termTitle.textContent = terms.title;

            createList(terms);
            t668_init('106156990');
        } catch (e) {
            console.error(e);
        }
        finally {
            this.loadingAnimation.stopLoadingAnimation();
        }
    }
}


new Policy({
    api: {
        url: 'api/legal/upradata-policy',
        domain: 'https://server.upradata.com'
    },
    loadingAnimation: {
        loadingMessage: `Loading the fully detailed digital.upradata.com "Privacy Policy". Be patient while the network is responding`,
        errorMessage: `<p>An error occured. We could not load the digital.upradata.com "Privacy Policy" document. Please, contact <a href="mailto:bug@upradata.com">bug@upradata.com</a> to help us fix the issue and get the document requested.</p>`
    }
});
