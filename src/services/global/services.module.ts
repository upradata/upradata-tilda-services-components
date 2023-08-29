
import { ModuleServices, ModulesServicesConfig, ModulesServicesConfOptions, servicesLoaded$, ModulesServices } from '@upradata/browser-util';
import { Service } from './types';
import { LoadingAnimationPopupOptions, LoadingAnimationPopup } from './loading-animation-popup.service';
import { LanguageService, LanguageServiceOptions } from './language.service';
import { Popup, PopupOptions } from './popup.service';


export type MtModuleServices = ModuleServices<Service, {
    popup: Popup;
    loadingAnimationPopup: LoadingAnimationPopup;
    language: LanguageService;
}>;


export interface MtTildaModuleServicesOpts {
    popup: PopupOptions;
    loadingAnimationPopup: Partial<LoadingAnimationPopupOptions>;
    language: LanguageServiceOptions;
}



export type MtModulesServices = ModulesServices<{
    tilda: MtModuleServices;
}>;


export type MtModulesServicesOpts = {
    tilda?: MtTildaModuleServicesOpts;
};

export type MtModulesServicesConfigOptions = ModulesServicesConfOptions<MtModulesServices, MtModulesServicesOpts>;

export type MtModulesServicesConfig = ModulesServicesConfig<MtModulesServices, MtModulesServicesConfigOptions>;





export const services: MtModulesServices = {} as any; // will be added by @upradata/browser-util/load-services in ./load-services.ts
export const servicesPromise$ = () => servicesLoaded$<MtModulesServices>();
