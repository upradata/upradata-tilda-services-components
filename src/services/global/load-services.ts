import { LoadServices, loadServices as load } from '@upradata/browser-util';
import { Service } from './types';
import { LoadingAnimationPopup } from './loading-animation-popup.service';
import { LanguageService } from './language.service';
import { Popup } from './popup.service';
import { loadScrollHashService } from './scroll-hash.service';
import { loadIsMobileService } from './is-mobile.service';
import { MtModuleServicesConfig, MtModuleServices, services, MtModulesServicesConfig, MtModulesServices } from './services.module';
import { EVENTS } from './load-services.event';

export const loadModuleServices: LoadServices<MtModuleServicesConfig, MtModuleServices, Service> = servicesConfig => {
    loadIsMobileService();
    loadScrollHashService();

    return {
        popup: new Popup(servicesConfig.popup),
        loadingAnimationPopup: new LoadingAnimationPopup(servicesConfig.loadingAnimationPopup),
        language: new LanguageService(servicesConfig.language)
    };
};


export const loadServices = (config: MtModuleServicesConfig): MtModulesServices => {
    const moduleConfig: Partial<MtModulesServicesConfig> = {
        modulesServices: {
            tilda: {
                module: { loadServices: loadModuleServices },
                config
            }
        },
        windowGlobal: 'mt',
        variable: services,
        include: undefined, // all
        exclude: undefined,
        dispatchEvents: true,
        servicesLoadedEventName: EVENTS.SERVICES_LOADED,
        serviceLoadedEventName: EVENTS.SERVICE_LOADED
    };

    const loadedServices = load(moduleConfig) as MtModulesServices;
    return loadedServices;
};

export const webpackEntry = () => {
    mt.loadServices = loadServices;
}; // for webpack (to have an entry to load the file)
