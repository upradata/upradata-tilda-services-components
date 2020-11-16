import { Term } from '@upradata/tilda-tools/lib/terms/terms.types';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../../services/global/loading-animation-popup.service';
import { Api } from '../../utils/api';
import { onAfterServicesLoaded } from '../../services/global/helpers';

export type NamedOptions<T> = T & { name: string; };

export interface TermComponentOptions {
    api: Api;
    loadingAnimation?: Partial<LoadingAnimationPopupOptions>;
    htmlCodeId: string;
}


export abstract class TermComponent {
    public api: Api;
    public htmlCodeId: string;
    protected loadingAnimation: LoadingAnimationPopup;
    protected ajaxSettings: JQuery.AjaxSettings;

    constructor(options: NamedOptions<TermComponentOptions>) {
        this.api = new Api(options.api);
        this.htmlCodeId = options.htmlCodeId;

        const loadingAnimationOptions = Object.assign({
            loadingMessage: `Loading "${options.name}". Be patient while the network is responding`,
            errorMessage: `An error occured. We could not load "${options.name}".`
        }, options.loadingAnimation, { autoShow: true, autoClose: true, });

        this.loadingAnimation = new LoadingAnimationPopup(loadingAnimationOptions);

        const { api } = this;
        const isLocal = [ '192.168.0', '127.0.0.1', 'localhost', 'treasure' ].some(prefix => location.href.includes(prefix));
        const url = isLocal ? `http://localhost:${api.devPort}/${api.url}` : `${this.api.domain}/${this.api.url}`;

        this.ajaxSettings = {
            crossDomain: true,
            url,
            method: 'GET',
            dataType: 'json',
            success: (...args) => this.onSuccess.apply(this, args),
            error: this.onError.bind(this)
        };
    }

    protected init() {
        onAfterServicesLoaded(() => this.doInit(), { waitForLoadEvent: true });
    }

    protected abstract doInit(): void | Promise<void>;

    protected sendAjaxRequest(ajaxSettings?: JQuery.AjaxSettings) {
        this.loadingAnimation.startLoadingAnimation({ delay: 500 });
        $.ajax(ajaxSettings || this.ajaxSettings);
    }

    protected onError(jqXHR: JQuery.jqXHR, textStatus: JQuery.Ajax.ErrorTextStatus, errorThrown: string) {
        this.loadingAnimation.onError();
        console.error('Error occured: ', { textStatus, errorThrown });
    }


    protected abstract onSuccess(term: Term, textStatus: JQuery.Ajax.SuccessTextStatus, jqXHR: JQuery.jqXHR): void | Promise<void>;
}
