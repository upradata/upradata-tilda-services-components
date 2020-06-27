import { PolicyShort } from './terms/policy-short.service';
import { LoadingAnimationPopupOptions } from './loading-animation-popup.service';

import { ServicesConfig, ServiceConfig } from '@upradata/browser-util';
import { LanguageService } from './language.service';
import { Terms, Policy } from './terms';



export interface MtServices {
    language: LanguageService;
    terms: Terms;
    policy: Policy;
    policyShort: PolicyShort;
}


export class MtServicesConfig extends ServicesConfig<MtServices>{

    services: {

    };
}
