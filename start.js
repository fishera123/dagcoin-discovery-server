/*jslint node: true */
"use strict";
const eventBus = require('byteballcore/event_bus.js');
const headlessWallet = require('./components/headless');
const ds = require('./discovery-service.js');

eventBus.on('headless_wallet_ready', function() {
    console.log('WALLET IS READY');

    try {
        console.log('REGISTERING LISTENERS ... ');
        ds.init();
        console.log('DONE REGISTERING LISTENERS');
    } catch(e) {
        console.error(e);
        process.exit();
    }
});

eventBus.on('paired', function (deviceAddress) {
    console.log('PAIR REQUEST');
    /* if (headlessWallet.isControlAddress(deviceAddress)) {
        headlessWallet.handlePairing(deviceAddress);
    } */
});

eventBus.on('text', function (deviceAddress, text) {
    console.log('TEXT REQUEST');
    processAsDagcoinMessage(deviceAddress, text);
});

// One device can send such message to check whether another device can exchange messages
eventBus.on('dagcoin.is-connected', (fromAddress, message) => {
    console.log('DAGCOIN CONNECTION REQUEST');

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
    console.log('PROCESSING MESSAGE AS DAGCOIN COMMAND');

    let message = null;

    try {
        message = JSON.parse(body);
    } catch (err) {
        console.log(`NEW MESSAGE FROM ${deviceAddress}: ${body} NOT A JSON MESSAGE: ${err}`);
        return;
    }

    if (message === null) {
        console.log(`NEW MESSAGE FROM ${deviceAddress}: EMPTY`);
        return;
    }

    if (message.protocol === 'dagcoin') {
        console.log(`DAGCOIN MESSAGE RECEIVED FROM ${deviceAddress}`);
        eventBus.emit(`dagcoin.${message.title}`, deviceAddress, message);
        return;
    }

    console.log(`JSON MESSAGE RECEIVED FROM ${deviceAddress} WITH UNEXPECTED PROTOCOL: ${message.protocol}`);
    var device = require('byteballcore/device.js');

    device.sendMessageToDevice(deviceAddress, 'text', JSON.stringify({
        protocol: 'dagcoin',
        title: 'error',
        errorMessage: 'ONLY ACCEPTING MESSAGES WITH dagcoin PROTOCOL'
    }));
}

module.exports = headlessWallet;