import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../loading-animation-popup.service';
import { Terms } from '@upradata/tilda-tools';
import { createList } from './list.client';
import { Api } from '../../utils';

declare function t668_init(s: string);

export type PopupMessage = (targetName: string) => string;

export class TermsClientOptions {
    api: Api;
    navId: string;
    loadingAnimation: Partial<LoadingAnimationPopupOptions>;
    popupMessages: { loadingMessage: PopupMessage; errorMessage: PopupMessage; };

    constructor(options: Partial<TermsClientOptions>) {
        this.navId = options.navId;
        this.api = new Api(options.api);

        const loadingAnimation = Object.assign({}, options.loadingAnimation, { autoShow: true, autoClose: true, });
        this.loadingAnimation = new mt.LoadingAnimationPopupOptions(loadingAnimation);

        this.popupMessages = Object.assign({
            loadingMessage: targetName => `Loading the "${targetName}" document. Be patient while the network is responding`,
            errorMessage: targetName => `An error occured. We could not load the "${targetName}" document.`
        }, options.popupMessages);
    }
}


export class TermsClient {
    private ajaxSettings: JQuery.AjaxSettings;
    private loadingAnimation: LoadingAnimationPopup;
    private options: TermsClientOptions;
    private navButtons: HTMLAnchorElement[];

    constructor(options: Partial<TermsClientOptions>) {
        this.options = new TermsClientOptions(options);

        const { api } = this.options;

        const domain = location.href.includes('192.168.0') || location.href.includes('localhost') ? `http://localhost:8080/${api.url}` : `${api.domain}/${api.url}`;

        const popup = new mt.Popup({ recid: mt.Popup.globalPopupRecId });
        this.loadingAnimation = new mt.LoadingAnimationPopup({ popup, ...this.options.loadingAnimation });

        this.ajaxSettings = {
            // async: true,
            crossDomain: true,
            url: domain,
            method: 'GET',
            dataType: 'json',
            success: this.onSuccess.bind(this),
            error: this.onError.bind(this)
        };

        window.addEventListener('popstate', event => this.handleHashChange());


        $(window).ready(() => {
            this.navButtons = Array.from(document.querySelectorAll(`${this.options.navId} .t-menu__link-item`));
            this.addEventListenerToButtonsOrLinks(this.navButtons);

            if (!history.state || history.state.pageName === '')
                this.changeHistoryState(this.getHash(this.navButtons[ 0 ].href), 'pushState');

            this.handleHashChange();
        });

    }


    onError(jqXHR: JQuery.jqXHR, textStatus: JQuery.Ajax.ErrorTextStatus, errorThrown: string) {
        this.loadingAnimation.onError();
        console.error('Error occured: ', { jqXHR, textStatus, errorThrown });
    }


    onSuccess(terms: Terms, textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR) {
        try {
            const pageName = history.state.pageName;
            const button = this.navButtons.find(b => this.getHash(b.href) === pageName);
            const previousButton = document.querySelector(`${this.options.navId} .t-menu__link-item.t-active`);

            if (previousButton)
                previousButton.classList.remove('t-active');

            button.classList.add('t-active');


            const termTitle = document.querySelector('#mt-term-title');
            termTitle.textContent = terms.title;

            createList(terms);
            t668_init('106156990');

            const aLinks: HTMLAnchorElement[] = Array.from(document.querySelectorAll('.mt-term-link'));
            this.addEventListenerToButtonsOrLinks(aLinks);
        } catch (e) {
            console.error(e);
        }
        finally {
            this.loadingAnimation.stopLoadingAnimation();
        }
    }



    getHash(url: string | Location) {
        const urlO = typeof url === 'string' ? new URL(url) : url;
        return urlO.hash.slice(1); // remove #
    }


    handleHashChange() {
        let targetName = this.getHash(location); // || getHash(navButtons[0].href);

        if (!targetName) { // can happen if arrow back in history and we come back to /terms
            targetName = this.getHash(this.navButtons[ 0 ].href);
            this.changeHistoryState(targetName, 'replaceState');
        }

        // never push state here because if we go back and then we pushState, we cannot go forward anymore

        const ajaxSettings = { ...this.ajaxSettings };
        ajaxSettings.url += targetName;

        this.loadingAnimation.loadingMessage = this.options.popupMessages.loadingMessage(targetName);
        this.loadingAnimation.errorMessage = this.options.popupMessages.errorMessage(targetName);

        this.loadingAnimation.startLoadingAnimation({ delay: 500 });
        $.ajax(ajaxSettings);
    }

    changeHistoryState(pageName: string, mode: 'replaceState' | 'pushState') {
        history[ mode ]({ pageName }, pageName, `${location.pathname}#${pageName}`);
    }


    addEventListenerToButtonsOrLinks(elements: HTMLAnchorElement[]) {

        for (const element of elements) {
            // it can be a button or a link not in the menu but in the text

            element.addEventListener('click', e => {
                e.preventDefault();

                const targetName = this.getHash(element.href);

                if (history.state && history.state.pageName === targetName)
                    return;

                this.changeHistoryState(targetName, 'pushState');
                this.handleHashChange();
            });
        }
    }
}
