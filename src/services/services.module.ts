import { ModulesServicesConfig, ModuleServicesConfig, ModulesServices, LoadServices, loadServices as load } from '@upradata/browser-util';
import { Service } from './types';
import { LoadingAnimationPopup } from './loading-animation-popup.service';
import { LanguageService } from './language.service';
import { Popup } from './popup.service';
import { loadScrollHashService } from './scroll-hash.service';
import { loadIsMobileService } from './is-mobile.service';
import { MtModuleServicesConfig, MtModuleServices, services } from './all-services';
export * from './all-services';

export const loadModuleServices: LoadServices<MtModuleServicesConfig, MtModuleServices, Service> = async servicesConfig => {
    loadIsMobileService();
    loadScrollHashService();

    services.popup = new Popup(servicesConfig.popup);
    services.loadingAnimationPopup = new LoadingAnimationPopup(servicesConfig.loadingAnimationPopup);
    services.language = new LanguageService(servicesConfig.language);

    return services;
};


export interface MtModulesServices extends ModulesServices<Service> {
    default: MtModuleServices;
}


export class MtModulesServicesConfig extends ModulesServicesConfig<MtModulesServices, Service>{
    modulesServices: {
        default: ModuleServicesConfig<MtModuleServices, MtModuleServicesConfig>;
    };
}


const base = 'mt-tilda-services';

export const EVENTS = {
    SERVICES_LOADED: `${base}/services-loaded`,
    SERVICE_LOADED: (name: string) => `${base}/services-loaded/${name}`
};


export const loadServices = (config: MtModuleServicesConfig) => {
    const moduleConfig: MtModulesServicesConfig = {
        modulesServices: {
            default: {
                module: { loadServices: loadModuleServices },
                config
            }
        },
        windowGlobal: 'mt',
        include: undefined, // all
        exclude: undefined,
        dispatchEvents: true,
        servicesLoadedEventName: EVENTS.SERVICES_LOADED,
        serviceLoadedEventName: EVENTS.SERVICE_LOADED
    };

    return load(moduleConfig);
};
