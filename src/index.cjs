'use strict';
let modulePromise;
const load = () => (modulePromise ??= import('./index.js'));

exports.getExposureScore = (...args) => load().then((module) => module.getExposureScore(...args));
exports.getExposureInfo = (...args) => load().then((module) => module.getExposureInfo(...args));
exports.isPoorlyExposed = (...args) => load().then((module) => module.isPoorlyExposed(...args));
