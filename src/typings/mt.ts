import { Popup, PopupOptions } from '../components/popup.component';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../services';

export interface MT {
    Popup: typeof Popup;
    PopupOptions: typeof PopupOptions;
    LoadingAnimationPopup: typeof LoadingAnimationPopup;
    LoadingAnimationPopupOptions: typeof LoadingAnimationPopupOptions;
}


// https://stackoverflow.com/questions/45099605/ambient-declaration-with-an-imported-type-in-typescript
// declare global implies it is a global scope file and not a module

declare global {
    var mt: MT;
}
