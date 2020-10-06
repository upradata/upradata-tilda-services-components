
import { ModuleServices, ModulesServicesConfig, ModuleServicesConfig, ModulesServices, servicesPromise$ as servicesPromise } from '@upradata/browser-util';
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


export interface MtModulesServices extends ModulesServices<Service> {
    tildaGlobal: MtModuleServices;
}


export class MtModulesServicesConfig extends ModulesServicesConfig<MtModulesServices, Service>{
    modulesServices: {
        tildaGlobal: ModuleServicesConfig<MtModuleServices, MtModuleServicesConfig>;
    };
}

export const services: MtModuleServices = {} as any; // will be added by @upradata/browser-util/load-services in ./load-services.ts
export const servicesPromise$ = () => servicesPromise<MtModulesServices>();
