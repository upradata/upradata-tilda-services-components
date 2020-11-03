import { LoadServices, loadServices as load } from '@upradata/browser-util';
import { Service } from './types';
import { LoadingAnimationPopup } from './loading-animation-popup.service';
import { LanguageService } from './language.service';
import { Popup } from './popup.service';
import { loadScrollHashService } from './scroll-hash.service';
import { loadIsMobileService } from './is-mobile.service';
import { MtModuleServicesConfig, MtModuleServices, services, MtModulesServicesConfig, MtModulesServices } from './services.module';
import { EVENTS } from './load-services.event';

export const loadModuleServices: LoadServices<MtModuleServicesConfig, MtModuleServices, Service> = async servicesConfig => {
    loadIsMobileService();
    loadScrollHashService();

    services.popup = new Popup(servicesConfig.popup);
    services.loadingAnimationPopup = new LoadingAnimationPopup(servicesConfig.loadingAnimationPopup);
    services.language = new LanguageService(servicesConfig.language);

    return services;
};


export const loadServices = (config: MtModuleServicesConfig): MtModulesServices => {
    const moduleConfig: MtModulesServicesConfig = {
        modulesServices: {
            tildaGlobal: {
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

    return load(moduleConfig) as any as MtModulesServices;
};

export const webpackEntry = () => {
    mt.loadServices = loadServices;
}; // for webpack (to have an entry to load the file)
