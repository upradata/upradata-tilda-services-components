import { Selector, querySelectorByPath } from '@upradata/tilda-tools/lib/src/i18n/import-text/import-text.common';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from './loading-animation-popup.service';
import { Api } from '../../utils/api';
import { isUndefined } from '@upradata/util/lib-esm';
// import { MT } from '../typings/mt';
// import { Popup } from './popup.service';

// declare const mt: MT; // for build-scripts-streams to compile (apparently running ts programatically does not understand global ambiant declaration)

export class TextData extends Selector {
    extra?: string;
}


export class LanguageServiceOptions {
    api: Api;
    includedPages?: string[] = [];
    excludedPages?: string[] = [];
    selector: {
        langLinksDesktop: '[id^="nav"] .t228__right_langs_lang a',
        langLinksMobile: '[id^="nav"] .t282__lang a';
    };
    defaultLanguage: string;
    languages: { lang: string; name: string; }[];
    loadingAnimation?: Partial<LoadingAnimationPopupOptions>;
    activeLinkClass?: string = 'mt-lang-link-active';
    // popup: Popup; // = new mt.Popup({ recid: mt.Popup.globalPopupRecId });

    constructor(options: LanguageServiceOptions) {
        Object.assign(this, options);
        this.api = new Api(options.api);
    }
}


export class LanguageService {
    public options: LanguageServiceOptions;
    private langLinksDesktop: NodeListOf<Element>;
    private langLinksMobile: NodeListOf<Element>;
    private ajaxSettings: JQuery.AjaxSettings;
    private langLinks: Element[];
    private loadingAnimation: LoadingAnimationPopup;
    private domain: string;
    private loadingLang: string;

    constructor(options: LanguageServiceOptions) {
        this.options = new LanguageServiceOptions(options);

        const { api, defaultLanguage, selector } = this.options;

        this.ajaxSettings = {
            crossDomain: true,
            cache: false,
            url: '', // to be set later
            method: 'GET',
            dataType: 'json',
            success: this.onSuccess.bind(this),
            error: this.onError.bind(this)
        };


        this.loadingAnimation = new LoadingAnimationPopup({ autoShow: true, autoClose: true });

        this.domain = location.href.includes('192.168.0') || location.href.includes('localhost') ? `http://localhost:${api.devPort}/${api.url}` : `${api.domain}/${api.url}`;

        this.options.defaultLanguage = defaultLanguage || this.langLinks[ 0 ].textContent.toLowerCase();

        $(window).ready(() => {
            this.langLinksDesktop = document.querySelectorAll(selector.langLinksDesktop);
            this.langLinksMobile = document.querySelectorAll(selector.langLinksMobile);

            this.langLinks = [ ...this.langLinksDesktop, ...this.langLinksMobile ];
            this.init();
        });
    }

    private getSavedLang() {
        const savedLang = localStorage.getItem('language');
        return this.options.languages.find(l => l.lang === savedLang);

    }

    init() {
        const savedLang = this.getSavedLang();
        const activeLang = savedLang ? savedLang.lang : this.options.defaultLanguage;

        for (const a of this.langLinks) {

            const lang = a.textContent.trim().toLowerCase();

            if (activeLang === lang)
                a.classList.add(this.options.activeLinkClass);

            a.addEventListener('click', e => {
                e.preventDefault();
                this.handleChangeLang(lang);
            });
        }

        // window.addEventListener('popstate', event => this.handleHashChange());
        // window.addEventListener('hashchange', event => this.handleHashChange(), false); on click


        if (location.hash)
            this.handleHashChange();
        else {
            if (activeLang !== this.options.defaultLanguage)
                this.loadPage(activeLang);
        }
    }

    private handleHashChange() {
        const lang = location.hash.slice(1); // #fr (removes #, if no hash, then nothing)

        if (lang)
            this.handleChangeLang(lang);
    }

    private handleChangeLang(lang: string) {
        const savedLang = this.getSavedLang();

        if (savedLang && savedLang.lang === lang) // already translated
            return;

        this.loadPage(lang);
    }


    private loadPage(lang: string) {
        try {

            const { languages, defaultLanguage, includedPages, excludedPages } = this.options;

            this.loadingLang = lang;

            /* const foundLang = languages.find(l => l.lang === lang);
            const language = foundLang ? foundLang.name : lang; */
            const language = languages.find(l => l.lang === lang);
            if (!language)
                return;

            this.loadingAnimation.loadingMessage = `Loading "${language.name}" translation. Be patient while the network is responding`;
            // tslint:disable-next-line:max-line-length
            this.loadingAnimation.errorMessage = `<p>An error occured. We could not load the "${language.name}" translation of the website. Please, contact <a href="mailto:bug@upradata.com">bug@upradata.com</a> to help us fix the issue.</p>`;

            // reload the page (having the default language).
            // No need to catch the text from the AppEngine service and populate the page
            if (lang === defaultLanguage) {
                this.loadingAnimation.startLoadingAnimation({ delay: 500 }).then(() => {
                    localStorage.setItem('language', lang);
                    window.location.href = location.origin + location.pathname;
                });
            } else {

                const pageName = window.location.pathname.slice(1) || 'home'; // remove the head / (for pathname ==='' => 'home')

                if (includedPages.length > 0 && includedPages.indexOf(pageName) === -1) // we translate only the allowed pages
                    return;

                if (excludedPages.length > 0 && excludedPages.indexOf(pageName) !== -1) // we do not translate excluded pages
                    return;

                if (pageName.endsWith('.html')) {
                    const nameMatch = pageName.match(/-(.*)\.html/);
                    const name = nameMatch ? nameMatch[ 1 ] : pageName.match(/(.*)\.html/)[ 1 ];

                    this.ajaxSettings.url = `${this.domain}${pageName}?page=${name}&lang=${lang}`;
                } else
                    this.ajaxSettings.url = `${this.domain}${pageName}-${lang}`;


                this.loadingAnimation.startLoadingAnimation({ delay: 500 });

                $.ajax(this.ajaxSettings);
            }
        } catch (e) {
            console.error(e);
            // https://michalzalecki.com/why-using-localStorage-directly-is-a-bad-idea/
            // But for us it is ok. No dramatic if translation not working
        }
    }

    private updateText(el: Node, newText: string) {
        const oldText = el.textContent;

        const preWhiteSpaces = oldText.match(/^\s*/)[ 0 ];
        let postWhiteSpaces = oldText.match(/\s*$/)[ 0 ];
        if (newText.endsWith('\''))
            postWhiteSpaces = '';

        el.textContent = `${preWhiteSpaces}${newText}${postWhiteSpaces}`;
    }

    private onError(jqXHR: JQuery.jqXHR, textStatus: JQuery.Ajax.ErrorTextStatus, errorThrown: string) {
        this.loadingAnimation.onError();
        console.error('Error occured: ', { textStatus, errorThrown });
    }


    private onSuccess(textList: TextData[], textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR) {
        const rowsWithExtraField: TextData[] = [];

        try {
            for (const row of textList) {

                try {
                    const el = querySelectorByPath(row);

                    if (el) {
                        if (row.extra)
                            rowsWithExtraField.push(row);

                        this.updateText(el, row.text);

                    } else
                        console.warn('Could not find:', row);

                } catch (e) {
                    console.warn(e);
                }
            }


            this.handleExtra(rowsWithExtraField);

            const { activeLinkClass } = this.options;

            const mobileAndDesktopActiveLinks = [ ...document.querySelectorAll(`.${activeLinkClass}`) ];
            mobileAndDesktopActiveLinks.forEach(a => a.classList.remove(activeLinkClass));

            const mobileAndDesktopLangLinks = this.langLinks.filter(a => a.textContent.trim().toLowerCase() === this.loadingLang);
            mobileAndDesktopLangLinks.forEach(a => a.classList.add(activeLinkClass));
        }
        catch (e) {
            this.loadingAnimation.onError();
            console.error(e);
        }

        this.loadingAnimation.stopLoadingAnimation();
        localStorage.setItem('language', this.loadingLang);
        this.loadingLang = undefined;
    }

    private handleExtra(rowsWithExtraField: TextData[]) {

        const nodesById: { [ id: string ]: Node[]; } = {};

        for (const row of rowsWithExtraField) {
            if (row.extra.startsWith('id')) {
                // format id=0:2 => id=0 and location=2
                // for one "phrase", the children 0, 1, 2, ...,n can be shuffled.
                // So it can be 0 => 2; 1 => 0; 2 => 1
                // Thus, id=0:2; id=0:0; id=0:1 for phrase id=0
                // location starts from 1 (not 0)
                const location = row.extra.split('=')[ 1 ];
                const [ id, loc ] = location.split(':');
                const pos = parseFloat(loc);

                const node = querySelectorByPath(row);

                if (!nodesById[ id ])
                    nodesById[ id ] = [];

                nodesById[ id ][ pos - 1 ] = node;
            } else {
                console.log(`Extra ${row.extra} not handled: ${row}`);
            }
        }

        // we reconstruct the "phrase"
        for (const [ id, nodes ] of Object.entries(nodesById)) {
            let count = 0;

            if (nodes.some(node => ++count && node === undefined)) {
                console.warn(`Could not reconstruct i18n phrase with id: ${id}. At least one extra item returns undefined from querySelectorByPath`);
                continue;
            }

            if (count !== nodes.length) {
                console.warn(`Could not reconstruct i18n phrase with id: ${id}. It is missing positioned item(s).
                There are ${count} positioned items for a maximum positioned item of ${nodes.length}`);
                continue;
            }

            const ancestor = this.commonAncestor(nodes);
            const clones = [];

            for (const node of nodes) {
                // we can have <div>111 <span><span>LALALA</span></span> 222</div>

                if (ancestor === node.parentElement)
                    clones.push(node.cloneNode(true));
                else {
                    let p = node.parentElement;
                    for (; p.parentElement !== ancestor; p = p.parentElement) { }
                    clones.push(p.cloneNode(true));
                }
            }

            ancestor.innerHTML = '';
            for (const clone of clones)
                ancestor.appendChild(clone);
        }
    }


    private commonAncestor(textNodes: Node[]) {
        let parent = { node: undefined, textContent: '' };

        for (const textNode of textNodes) {
            // get common parent
            const nodeParent = textNode.parentElement;
            const textContent = nodeParent.textContent;

            if (textContent.includes(parent.textContent) && textContent.length > parent.textContent.length)
                parent = { node: nodeParent, textContent };
        }

        return parent.node;
    }
}
