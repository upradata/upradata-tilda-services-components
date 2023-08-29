import { LoadServices, loadServices as load, ModulesServicesConfig } from '@upradata/browser-util';
import { LoadingAnimationPopup } from './loading-animation-popup.service';
import { LanguageService } from './language.service';
import { Popup } from './popup.service';
import { loadScrollHashService } from './scroll-hash.service';
import { loadIsMobileService } from './is-mobile.service';
import { MtModulesServicesConfig, MtModuleServices, services, MtModulesServices, MtTildaModuleServicesOpts } from './services.module';
import { EVENTS } from './load-services.event';

export const loadModuleServices: LoadServices<MtTildaModuleServicesOpts, MtModuleServices> = servicesConfig => {
    loadIsMobileService();
    loadScrollHashService();

    return {
        popup: new Popup(servicesConfig.popup),
        loadingAnimationPopup: new LoadingAnimationPopup(servicesConfig.loadingAnimationPopup),
        language: new LanguageService(servicesConfig.language)
    };
};


export const loadServices = (config: MtTildaModuleServicesOpts): MtModulesServices => {
    const moduleConfig: MtModulesServicesConfig = {
        config: {
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
