'use strict';

var mock = require('mock-require-lazy');
mock('glob', require('./vendor/glob/glob'));

module.exports = require('./lib/mocha');
