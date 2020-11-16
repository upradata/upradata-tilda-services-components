import { EVENTS } from './load-services.event';

export const onAfterServicesLoaded = (func: () => any, options: { waitForLoadEvent?: boolean; } = {}) => {
    const { waitForLoadEvent } = options;
    const isLoadeEventFired = () => waitForLoadEvent ? document.readyState === 'complete' : true;


    let isInit = false;

    const init = () => {
        if (mt.loaded && isLoadeEventFired()) {
            isInit = true;
            func();
            return true;
        }

        return false;
    };

    if (!init()) {
        window.addEventListener('load', init);
        window.addEventListener(EVENTS.SERVICES_LOADED, init);
    }
};


export const onLoad = (func: () => any) => {
    if (document.readyState === 'complete')
        func();
    else
        document.addEventListener('load', func);
};
