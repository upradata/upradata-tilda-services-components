
const base = 'mt-tilda-services';

export const EVENTS = {
    SERVICES_LOADED: `${base}/services-loaded`,
    SERVICE_LOADED: (name: string) => `${base}/services-loaded/${name}`,
};
