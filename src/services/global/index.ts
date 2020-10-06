export * from './load-services';
export * from './services.module';
export * from './is-mobile.service';
export * from './loading-animation-popup.service';
export * from './language.service';
export * from './popup.service';

import { webpackEntry } from './load-services';

webpackEntry();
