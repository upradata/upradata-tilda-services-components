declare function t868__readCustomCode(rec: JQuery<HTMLElement>): string;
declare function t868_setHeight(recid: string): void;
declare function t868_resizePopup(recid: string): void;


export class PopupOptions {
    recid?: string = Popup.globalPopupRecId;

    constructor(options: PopupOptions = {}) {
        Object.assign(this, options);
    }
}

export class Popup {
    static globalPopupRecId: string;
    static linkId: string;
    options: PopupOptions;
    recid: string;
    rec: JQuery<HTMLElement>;
    popup: JQuery<HTMLElement>;
    popupContainer: JQuery<HTMLElement>;
    customCodeHTML: string; // Code inside Tilda Popup Block that can be inserted in the online editor
    isOpen: boolean = false;

    constructor(options: Partial<PopupOptions> = {}) {
        this.options = Object.assign(new PopupOptions(), options);
        this.recid = this.options.recid;
        this.rec = $('#rec' + this.options.recid);
        this.popup = this.rec.find('.t-popup');
        this.popupContainer = this.rec.find('.t-popup__container');
        this.customCodeHTML = t868__readCustomCode(this.rec);
    }

    append(element: HTMLElement) {
        this.popupContainer.get(0).appendChild(element);
    }

    remove(element: HTMLElement) {
        const popupContainer = this.popupContainer.get(0);

        if ([ ...popupContainer.childNodes ].find(n => n === element))
            popupContainer.removeChild(element);
    }

    clear() {
        this.popupContainer.get(0).innerHTML = ''; // get(0) to access Dom Element from JQuery
    }

    showPopup() {
        // t868_showPopup(recid, customCodeHTML); almost copy/paste

        if (this.isOpen)
            return;

        this.popupContainer.append(this.customCodeHTML);

        this.popup.css('display', 'block');
        t868_setHeight(this.recid);
        // setTimeout(function () {
        this.popup.find('.t-popup__container').addClass('t-popup__container-animated');
        this.popup.addClass('t-popup_show');
        // }, 50);
        $('body').addClass('t-body_popupshowed');


        this.rec.find('.t-popup').click(e => {
            if (e.target === this.popup.get(0)) {
                // t868_closePopup(this.recid)
                this.closePopup();
            }
        });

        this.rec.find('.t-popup__close').click(e => {
            // t868_closePopup(this.recid)
            this.closePopup();
        });

        t868_resizePopup(this.recid);

        this.isOpen = true;
    }

    closePopup() {
        // t868_closePopup(this.recid); copy/paste
        if (this.isOpen) {
            this.popup.removeClass('t-popup_show');

            if ($('.t-popup_show').length === 0) // only this one was opened (not any in the app from here or Tilda)
                $('body').removeClass('t-body_popupshowed');

            this.popupContainer.empty();

            setTimeout(() => {
                this.popup.not('.t-popup_show').css('display', 'none');
            }, 300);

            this.isOpen = false;
        }
    }
}
