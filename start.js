/*jslint node: true */
"use strict";
var eventBus = require('byteballcore/event_bus.js');
var headlessWallet = require('headless-byteball');

eventBus.on('paired', function (deviceAddress) {
    if (headlessWallet.isControlAddress(deviceAddress)) {
        headlessWallet.handlePairing(deviceAddress);
    }
});

eventBus.on('text', function (deviceAddress, text) {
    processAsDagcoinMessage(deviceAddress, text);
});

// One device can send such message to check whether another device can exchange messages
eventBus.on('dagcoin.is-connected', (message, fromAddress) => {
    const reply = {
        protocol: 'dagcoin',
        title: 'connected'
    };

    const device = require('byteballcore/device.js');
    device.sendMessageToDevice(fromAddress, 'text', JSON.stringify(reply));
});

/**
 * Process a message considering the possibility it is a Dagcoin message.
 * It tries to parse it, if it succeeds and if a protocol property is present (and set to dagcoin) then it
 * emits the appropriate event.
 * @param deviceAddress The message sender address
 * @param body The message body as pure text
 * @returns {Promise}
 */
function processAsDagcoinMessage(deviceAddress, body) {
    let message = null;

    try {
        message = JSON.parse(body);
    } catch (err) {
        console.log(`NEW MESSAGE FROM ${deviceAddress}: ${body} NOT A JSON MESSAGE: ${err}`);
    }

    if (message === null) {
        console.log(`NEW MESSAGE FROM ${deviceAddress}: EMPTY`);
        return;
    }

    if (message.protocol === 'dagcoin') {
        console.log(`DAGCOIN MESSAGE RECEIVED FROM ${deviceAddress}`);
        eventBus.emit(`dagcoin.${message.title}`, message, deviceAddress);
        return;
    }

    console.log(`JSON MESSAGE RECEIVED FROM ${deviceAddress} WITH UNEXPECTED PROTOCOL: ${message.protocol}`);
    var device = require('byteballcore/device.js');
    var db = require('byteballcore/db.js');
    var ds = require('./discovery-service.js');
    var discoveryService = new ds.DiscoveryService(device, db);
    discoveryService.processCommand(deviceAddress, text);
}

module.exports = headlessWallet;