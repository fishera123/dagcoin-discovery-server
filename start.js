/*jslint node: true */
"use strict";
var constants = require('byteballcore/constants.js');
var conf = require('byteballcore/conf.js');
var db = require('byteballcore/db.js');
var eventBus = require('byteballcore/event_bus.js');
var headlessWallet = require('headless-byteball');
var ValidationUtils = require("byteballcore/validation_utils.js");

eventBus.on('paired', function(deviceAddress){
	if (headlessWallet.isControlAddress(deviceAddress)){
		headlessWallet.handlePairing(deviceAddress);
	}	
});

eventBus.on('text', function(deviceAddress, text){
    var device = require('byteballcore/device.js');
    var ds = require('./discovery-service.js');
	var discoveryService = new ds.DiscoveryService(device);
    discoveryService.processCommand(deviceAddress, text);
});

module.exports = headlessWallet;