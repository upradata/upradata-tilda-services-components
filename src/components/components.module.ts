import { PolicyShort, Policy, Terms } from './terms';

export interface MtModuleComponents {
    PolicyShort: typeof PolicyShort;
    Policy: typeof Policy;
    Terms: typeof Terms;
}
