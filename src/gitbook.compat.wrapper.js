/**
 * Gitbook doesn't work w/ ES6 style exports,
 * or even unwrap them to look for `module.exports.default`
 * so we're stuck w/ this
 */

import main from './index';

module.exports = main;
