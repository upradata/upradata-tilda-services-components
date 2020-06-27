import { Term } from '@upradata/tilda-tools/lib/src/terms/terms.types';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../loading-animation-popup.service';
import { Api } from '../../utils/api';
import { buildTerm } from './build-term';

export type PopupMessage = (targetName: string) => string;

export class TermsOptions {
    api: Api;
    navId: string;
    htmlCodeId: string;
    loadingAnimation?: Partial<LoadingAnimationPopupOptions>;
    popupMessages?: { loadingMessage: PopupMessage; errorMessage: PopupMessage; };
    termsLinksSelector?: string = '.mt-term-link';

    constructor(options: TermsOptions) {
        Object.assign(this, options);
        this.api = new Api(options.api);

        this.loadingAnimation = Object.assign({}, options.loadingAnimation, { autoShow: true, autoClose: true, });

        this.popupMessages = Object.assign({
            loadingMessage: (targetName: string) => `Loading the "${targetName}" document. Be patient while the network is responding`,
            errorMessage: (targetName: string) => `An error occured. We could not load the "${targetName}" document.`
        }, options.popupMessages);
    }
}


export class Terms {
    private ajaxSettings: JQuery.AjaxSettings;
    private loadingAnimation: LoadingAnimationPopup;
    private options: TermsOptions;
    private navButtons: HTMLAnchorElement[];

    constructor(options: TermsOptions) {
        this.options = new TermsOptions(options);

        const { api } = this.options;

        const domain = location.href.includes('192.168.0') || location.href.includes('localhost') ? `http://localhost:${api.devPort}/${api.url}` : `${api.domain}/${api.url}`;

        const popup = new mt.Popup({ recid: mt.Popup.globalPopupRecId });
        this.loadingAnimation = new mt.LoadingAnimationPopup({ popup, ...this.options.loadingAnimation });

        this.ajaxSettings = {
            // async: true,
            crossDomain: true,
            url: domain,
            method: 'GET',
            dataType: 'json',
            success: (...args) => this.onSuccess.apply(this, args), // jQuery not working with async function
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

    private onError(jqXHR: JQuery.jqXHR, textStatus: JQuery.Ajax.ErrorTextStatus, errorThrown: string) {
        this.loadingAnimation.onError();
        console.error('Error occured: ', { jqXHR, textStatus, errorThrown });
    }

    private onSuccess(term: Term, textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR) {
        try {
            const pageName = history.state.pageName;
            const button = this.navButtons.find(b => this.getHash(b.href) === pageName);
            const previousButton = document.querySelector(`${this.options.navId} .t-menu__link-item.t-active`);

            if (previousButton)
                previousButton.classList.remove('t-active');

            button.classList.add('t-active');

            const { termElement, init } = buildTerm(term);
            const htmlEl = document.querySelector(this.options.htmlCodeId);
            htmlEl.innerHTML = '';
            // this will create the stencil custom element, loading the class if it was the first one created
            // (and calling the constructor). We can call the methods from the prototype now
            htmlEl.appendChild(termElement);

            init().then(() => this.observeNewLinks());
        } catch (e) {
            console.error(e);
        }

        this.loadingAnimation.stopLoadingAnimation();
    }

    private observeNewLinks() {
        const htmlEl = document.querySelector(this.options.htmlCodeId);

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    const aLinks = new Set<HTMLAnchorElement>();

                    [ ...htmlEl.querySelectorAll('a') ].filter(link => {
                        const url = new URL(link.href);
                        return url.hash !== '' && url.hostname === location.hostname && url.pathname && location.pathname;
                    }).forEach(e => aLinks.add(e));

                    Array.from<HTMLAnchorElement>(htmlEl.querySelectorAll(this.options.termsLinksSelector)).forEach(e => aLinks.add(e));

                    const linksToBeAdded = [ ...aLinks ].filter(e => !e.classList.contains('mt-link-added')).map(e => { e.classList.add('mt-link-added'); return e; });

                    this.addEventListenerToButtonsOrLinks(linksToBeAdded);
                }
            }
        });

        // Start observing the target node for configured mutations
        observer.observe(htmlEl, { childList: true, subtree: true });
    }

    private getHash(url: string | Location) {
        const urlO = typeof url === 'string' ? new URL(url) : url;
        return urlO.hash.slice(1); // remove #
    }


    private handleHashChange() {
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

    private changeHistoryState(pageName: string, mode: 'replaceState' | 'pushState') {
        history[ mode ]({ pageName }, pageName, `${location.pathname}#${pageName}`);
    }


    private addEventListenerToButtonsOrLinks(elements: HTMLAnchorElement[]) {

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
