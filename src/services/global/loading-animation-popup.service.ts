import { Function0 } from '@upradata/util';
import { MT } from '../../typings/mt';

export class LoadingAnimationPopupOptions {
    // popup: Popup; // = new Popup({ recid: Popup.globalPopupRecId });
    loadingMessage: string = 'Loading. Be patient while the network is responding';
    errorMessage: string = `<p>An error occured. Please, contact <a href="mailto:bug@upradata.com">bug@upradata.com</a> to get the information you wished and help us at the same time to fix the issue.</p>`;
    autoShow: boolean = false;
    autoClose: boolean = false;

    constructor(options: Partial<LoadingAnimationPopupOptions>) {
        Object.assign(this, options);
    }
}


export class LoadingAnimationPopup {
    public options: LoadingAnimationPopupOptions;
    public loadingMessage: string;
    public errorMessage: string;
    private p: HTMLParagraphElement;
    private stopAnimation: Function0<void> = () => { };

    constructor(options?: Partial<LoadingAnimationPopupOptions>) {
        this.options = new LoadingAnimationPopupOptions(options);
        this.loadingMessage = this.options.loadingMessage;
        this.errorMessage = this.options.errorMessage;
        this.p = document.createElement('p');
        this.p.setAttribute('style', 'padding: 10%; text-align: center;');
    }

    static replaceAt(s: string, index: number, replacement: string) {
        return s.substr(0, index) + replacement + s.substr(index + replacement.length);
    }


    startLoadingAnimation(options: { loadingMessage?: string; delay?: number; autoShow?: boolean; } = {}) {
        const { loadingMessage, delay = 0, autoShow } = options;

        return new Promise((res, rej) => {
            let startTimeoutId: number = undefined;
            let loadingTextIntervalId: number = undefined;

            this.stopAnimation = () => {
                clearTimeout(startTimeoutId);
                clearInterval(loadingTextIntervalId);
                startTimeoutId = undefined;
                loadingTextIntervalId = undefined;
            };

            startTimeoutId = window.setTimeout(() => {
                if (!startTimeoutId)
                    return;

                const msg = loadingMessage || this.loadingMessage;
                const loadingText = msg + '\xa0\xa0\xa0'; // \xa0 === &nbsp; non breakable space

                const p = this.p;
                p.textContent = loadingText;

                // this.options.popup.clear();
                mt.services.tilda.popup.append(p);

                let i = 0;
                const len = loadingText.length;

                loadingTextIntervalId = window.setInterval(() => {
                    if (i === 3) {
                        p.textContent = loadingText;
                        i = 0;
                    } else {
                        p.textContent = LoadingAnimationPopup.replaceAt(p.textContent, len - (3 - i), '.');
                        ++i;
                    }

                }, 500);

                if (autoShow || this.options.autoShow)
                    mt.services.tilda.popup.showPopup();

                res();
            }, delay);
        });
    }

    stopLoadingAnimation(options: { autoClose?: boolean; } = {}) {
        this.stopAnimation();

        // this.options.popup.clear();
        mt.services.tilda.popup.remove(this.p);

        if (options.autoClose || options.autoClose === undefined && this.options.autoClose)
            mt.services.tilda.popup.closePopup();
    }

    onError(errorMessage?: string) {
        this.stopLoadingAnimation();
        mt.services.tilda.popup.showPopup();

        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = errorMessage || this.errorMessage;
        errorDiv.setAttribute('style', 'padding: 10%; text-align: center;');

        mt.services.tilda.popup.append(errorDiv);
    }

}
