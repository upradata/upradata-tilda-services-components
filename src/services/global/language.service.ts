import { stripIndents } from 'common-tags';
import { querySelectorByPath } from '@upradata/tilda-tools/lib/i18n/import-text/import-text.common';
import { /* Selector, */ TextData } from '@upradata/tilda-tools/lib/i18n/import-text/types';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from './loading-animation-popup.service';
import { Api } from '../../utils/api';
import { isUndefined } from '@upradata/util';

// import { MT } from '../typings/mt';
// import { Popup } from './popup.service';

// declare const mt: MT; // for build-scripts-streams to compile (apparently running ts programatically does not understand global ambiant declaration)

/* export class TextData extends Selector {
    extra?: string;
} */


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
    disableLinkClass?: string = 'mt-lang-link-disable';

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
    private defaultLangExtraNodes: { [ id: string ]: { parent: HTMLElement; nodes: { node: Node; row: TextData; }[]; }; } = {};

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
        const { includedPages, excludedPages } = this.options;

        if (
            includedPages.length > 0 && includedPages.indexOf(this.pageName) === -1 || // we translate only the allowed pages
            excludedPages.length > 0 && excludedPages.indexOf(this.pageName) !== -1 // we do not translate excluded pages
        ) {
            this.disable();
            return;
        }

        const savedLang = this.getSavedLang();
        const activeLang = savedLang ? savedLang.lang : this.options.defaultLanguage;

        this.updateCssMenuLanguage();

        for (const a of this.langLinks) {

            const lang = a.textContent.trim().toLowerCase();

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

    private get pageName() {
        return window.location.pathname.slice(1) || 'home';
    }

    private loadPage(lang: string) {
        try {

            const { languages } = this.options;

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
            // No need to catch the text from the server service and populate the page
            /* if (lang === defaultLanguage) {
                this.loadingAnimation.startLoadingAnimation({ delay: 500 }).then(() => {
                    localStorage.setItem('language', lang);
                    window.location.href = location.origin + location.pathname;
                });
            } else { */

            const pageName = this.pageName;

            if (pageName.endsWith('.html')) {
                const nameMatch = pageName.match(/-(.*)\.html/);
                const name = nameMatch ? nameMatch[ 1 ] : pageName.match(/(.*)\.html/)[ 1 ];

                this.ajaxSettings.url = `${this.domain}${pageName}?page=${name}&lang=${lang}`;
            } else
                this.ajaxSettings.url = `${this.domain}${pageName}-${lang}`;


            this.loadingAnimation.startLoadingAnimation({ delay: 500 });

            $.ajax(this.ajaxSettings);
            // }
        } catch (e) {
            console.error(e);
            // https://michalzalecki.com/why-using-localStorage-directly-is-a-bad-idea/
            // But for us it is ok. No dramatic if translation not working
        }
    }

    private updateText(el: Node, newText: string, options?: string[]) {
        const oldText = el.textContent;

        const preWhiteSpaces = oldText.match(/^\s*/)[ 0 ];
        let postWhiteSpaces = oldText.match(/\s*$/)[ 0 ];
        if (newText.endsWith('\''))
            postWhiteSpaces = '';


        const hasHeadSpace = options && (
            options.some(o => o === 'head-space') ||
            !options.some(o => o === 'no-head-space' || o === 'no-space')
        );

        const text = hasHeadSpace && newText[ 0 ] !== ' ' ? ` ${newText}` : newText;

        el.textContent = `${preWhiteSpaces}${text}${postWhiteSpaces}`;
    }

    private getTextElement(node: Node) {
        let n = node;

        while (true) {
            if (n === null || n.nodeType === Node.TEXT_NODE)
                return n;

            n = n.firstChild;
        }
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
                    if (row.extra)
                        rowsWithExtraField.push(row);
                    else {

                        const el = querySelectorByPath(row);

                        if (el)
                            this.updateText(el, row.text);
                        else
                            console.error('Could not find:', row);
                    }
                } catch (e) {
                    console.error(e);
                }
            }


            this.handleExtra(rowsWithExtraField);
        }
        catch (e) {
            // this.loadingAnimation.onError();
            console.error(e);
        }

        localStorage.setItem('language', this.loadingLang);
        this.loadingLang = undefined;

        this.updateCssMenuLanguage();
    }

    private updateCssMenuLanguage() {
        const { activeLinkClass } = this.options;

        // const mobileAndDesktopActiveLinks = [ ...document.querySelectorAll(`.${activeLinkClass}`) ];
        // mobileAndDesktopActiveLinks.forEach(a => a.classList.remove(activeLinkClass));
        this.langLinks.forEach(a => a.classList.remove(activeLinkClass)); // enough

        const mobileAndDesktopLangLinks = this.langLinks.filter(a => a.textContent.trim().toLowerCase() === this.getSavedLang().lang);
        mobileAndDesktopLangLinks.forEach(a => a.classList.add(activeLinkClass));

        this.loadingAnimation.stopLoadingAnimation();
    }

    private disable() {
        const { activeLinkClass, disableLinkClass } = this.options;

        this.langLinks.forEach(a => a.classList.remove(activeLinkClass));

        const mobileAndDesktopLangLinks = this.langLinks.filter(a => a.textContent.trim().toLowerCase() === this.getSavedLang().lang);
        mobileAndDesktopLangLinks.forEach(a => a.classList.add(disableLinkClass));

        this.langLinks.forEach(a => a.addEventListener('click', e => e.preventDefault()));
    }

    private rowToString(row: TextData) {
        return `{ rootId: ${row.rootId}, path: ${row.path}, text: ${row.text} }`;
    }

    private parseExtra(row: TextData): { id: string; position: number; options: string[]; } {
        if (row.extra.startsWith('id')) {
            // format id=0:2?opt1,opt2 => id=0 and location=2 and options: [opt1, opt2]
            // for one "phrase", the children 0, 1, 2, ...,n can be shuffled.
            // So it can be 0 => 2; 1 => 0; 2 => 1
            // Thus, id=0:2; id=0:0; id=0:1 for phrase id=0
            // location starts from 1 (not 0)
            const locationAndOpts = row.extra.split('=')[ 1 ];
            const [ id, rest ] = locationAndOpts.split(':');
            const [ loc, opts ] = rest.split('?');

            const position = parseFloat(loc);
            const options = opts ? opts.split(',') : [];

            return { id, position, options };
        }

        console.log(`Extra ${row.extra} not handled: ${this.rowToString(row)}`);
        return undefined;
    }

    private handleExtra(rowsWithExtraField: TextData[]) {
        const { defaultLanguage } = this.options;

        const errors: string[] = [];

        try {

            this.regenerateDefaultLangExtraNodes();

            if (this.loadingLang === defaultLanguage) {
                this.defaultLangExtraNodes = {};
                return;
            }

            const nodesById: { [ id: string ]: { node: Node; row: TextData; }[]; } = {};
            const computeDefaultExtraNodes = Object.values(this.defaultLangExtraNodes).length === 0;

            for (const row of rowsWithExtraField) {
                try {
                    const { id, position: pos } = this.parseExtra(row) || {};

                    if (id) {
                        const node = querySelectorByPath(row);
                        if (!node)
                            console.error('Could not find:', row);


                        if (!nodesById[ id ])
                            nodesById[ id ] = [];

                        nodesById[ id ][ pos - 1 ] = { row, node };

                        if (computeDefaultExtraNodes) {
                            // keep references to original node for regenerateDefaultLangExtraNodes
                            const { id } = this.parseExtra(row);

                            this.defaultLangExtraNodes[ id ] = this.defaultLangExtraNodes[ id ] || { parent: undefined, nodes: [] };
                            this.defaultLangExtraNodes[ id ].nodes.push({ node, row }); // for default language, order is  always 1,2,3,4, ...
                        }
                    }
                } catch (e) {
                    errors.push(stripIndents`
                                Error while searching node for row: ${row}
                                ${e.message}
                                with stack: ${e.stack || e}`);
                }
            }

            if (computeDefaultExtraNodes) {
                // we retrieve the common ancestor needed in regenerateDefaultLangExtraNodes
                for (const [ id, defaultLangNodeList ] of Object.entries(this.defaultLangExtraNodes)) {
                    const ancestor = this.commonAncestor(nodesById[ id ].map(n => n.node));
                    defaultLangNodeList.parent = ancestor;

                    for (const [ i, { node, row } ] of Object.entries(defaultLangNodeList.nodes)) {
                        if (!node)
                            defaultLangNodeList.nodes = [];
                        else {
                            let n = node;
                            for (; n.parentElement !== ancestor; n = n.parentElement) { }

                            defaultLangNodeList.nodes[ i ] = { row, node: n.cloneNode(true) };
                        }
                    }
                }
            }


            // we reconstruct the "phrase"
            for (const [ id, nodes ] of Object.entries(nodesById)) {
                let count = 0;

                if (nodes.some(node => ++count && isUndefined(node.node))) {
                    for (const { row } of nodes.filter(n => isUndefined(n.node))) {
                        errors.push(stripIndents`
                                    Could not reconstruct i18n phrase with id: ${id}.
                                    row: ${this.rowToString(row)}
                                    At least one extra item returns "undefined" from querySelectorByPath`);
                    }

                    continue;
                }

                // nodes can have holes like [undefined, node, node, undefined, node] (index i represents position)
                // count is the number of not undefined node in the list
                if (count !== nodes.length) {
                    const rowsWithIndex = nodes.map((node, i) => `index [${i}]: ${this.rowToString(node.row)}`);

                    errors.push(stripIndents`
                                Could not reconstruct i18n phrase with id: ${id}. It is missing positioned item(s).
                                There are ${count} positioned items and should be ${nodes.length}
                                rows are: ${rowsWithIndex.join('\n')}`);

                    continue;
                }

                nodes.forEach(n => {
                    const { options } = this.parseExtra(n.row);
                    this.updateText(n.node, n.row.text, options);
                });

                const ancestor = this.commonAncestor(nodes.map(n => n.node));
                const clones = [];

                for (const { node } of nodes) {
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

        } catch (e) {
            console.error('Error while handling extra text', e);
        }

        errors.forEach(e => console.error(e));
    }

    private regenerateDefaultLangExtraNodes() {
        // inject back the original extra nodes
        // right after receiving new text to keep the order of the default language as a reference
        // to rearrange the other languages extra afterwards

        for (const defaultLangNodeList of Object.values(this.defaultLangExtraNodes)) {
            defaultLangNodeList.parent.innerHTML = '';

            for (const { node, row } of defaultLangNodeList.nodes) {
                this.updateText(this.getTextElement(node), node.textContent, this.parseExtra(row).options);
                defaultLangNodeList.parent.appendChild(node);
            }
        }
    }

    private commonAncestor(textNodes: Node[]) {
        let parent = { node: undefined as HTMLElement, textContent: '' };

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
