/* import { Popup, PopupOptions } from '../services/popup.service';
import { LoadingAnimationPopup, LoadingAnimationPopupOptions } from '../services'; */

import { MtModuleServices, MtModuleServicesConfig, MtModulesServices } from '../services/global/services.module';
import { MtModuleComponents } from '../components/components.module';

/* export interface MT {
    Popup: typeof Popup;
    PopupOptions: typeof PopupOptions;
    LoadingAnimationPopup: typeof LoadingAnimationPopup;
    LoadingAnimationPopupOptions: typeof LoadingAnimationPopupOptions;
} */


// https://stackoverflow.com/questions/45099605/ambient-declaration-with-an-imported-type-in-typescript
// declare global implies it is a global scope file and not a module

export type MT = MtModuleServices & MtModuleComponents & { loadServices: (config: MtModuleServicesConfig) => MtModulesServices; };

declare global {
    var mt: MT;
}
