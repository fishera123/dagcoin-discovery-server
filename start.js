/*jslint node: true */
"use strict";

const accountManager = require('dagcoin-core/accountManager').getInstance();
const exceptionManager = require('dagcoin-core/exceptionManager');
const eventBus = require('byteballcore/event_bus.js');
const databaseManager = require('dagcoin-core/databaseManager').getInstance();

databaseManager.onReady().then(() => {
    return accountManager.readAccount().then(() => {
        const deviceMgr = require('dagcoin-core/deviceManager').getInstance();
        const ds = require('./discovery-service.js').getInstance();

        eventBus.on('paired', function (deviceAddress) {
            console.log('PAIR REQUEST');
            /* if (headlessWallet.isControlAddress(deviceAddress)) {
                headlessWallet.handlePairing(deviceAddress);
            } */
        });
    });
}).catch((e) => {
    exceptionManager.logError(e);
});
