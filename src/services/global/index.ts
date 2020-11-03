export * from './load-services';
export * from './load-services.event';
export * from './services.module';
export * from './is-mobile.service';
export * from './loading-animation-popup.service';
export * from './language.service';
export * from './popup.service';
export * from './scroll-hash.service';

import { webpackEntry } from './load-services';

webpackEntry();

const event = new CustomEvent('mt/loaded', { detail: { what: 'load-services' } });
document.dispatchEvent(event);
