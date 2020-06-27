const base = 'mt-services-components';

export const EVENTS = {
    SERVICES_LOADED: `${base}-loaded`,
    SERVICE_LOADED: (name: string) => `${base}-loaded/${name}`
};
