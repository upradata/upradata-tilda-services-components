
import { ModuleServices } from '@upradata/browser-util';
import { Service } from './types';
import { LoadingAnimationPopupOptions, LoadingAnimationPopup } from './loading-animation-popup.service';
import { LanguageService, LanguageServiceOptions } from './language.service';
import { Popup, PopupOptions } from './popup.service';


export interface MtModuleServices extends ModuleServices<Service> {
    popup: Popup;
    loadingAnimationPopup: LoadingAnimationPopup;
    language: LanguageService;
}


export class MtModuleServicesConfig {
    popup: PopupOptions;
    loadingAnimationPopup: Partial<LoadingAnimationPopupOptions>;
    language: LanguageServiceOptions;
}


export const services: MtModuleServices = {} as any;
