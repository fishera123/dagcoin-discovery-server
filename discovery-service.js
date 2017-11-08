"use strict";

let instance = null;

function DiscoveryService() {
    this.eventBus = require('byteballcore/event_bus');
    this.deviceManager = require('dagcoin-core/deviceManager').getInstance();
    this.dbManager = require('dagcoin-core/databaseManager').getInstance();
    this.conf = require('byteballcore/conf.js');

    this.commands = {
        startingTheBusiness: 'STARTING_THE_BUSINESS',
        aliveAndWell: 'ALIVE_AND_WELL',
        temporarilyUnavailable: 'TEMPORARILY_UNAVAILABLE',
        outOfBusiness: 'OUT_OF_BUSINESS',
        listTraders: 'LIST_TRADERS',
        updateSettings: 'UPDATE_SETTINGS',
        unrecognized: 'UNRECOGNIZED'
    };

    const self = this;

    console.log('REGISTERING LISTENERS WITHIN THE DISCOVERY SERVICE');

    // LIST_TRADERS
    self.eventBus.on(`dagcoin.request.${self.commands.listTraders}`, (deviceAddress, message) => {
        self.getListOfFundingNodes(deviceAddress).then((listOfNodes) => {
            self.deviceManager.sendResponse(
                deviceAddress,
                this.commands.listTraders,
                {traders: listOfNodes || []},
                message.id
            );
        });
    });

    // STARTING THE BUSINESS
    self.eventBus.on(`dagcoin.request.${self.commands.startingTheBusiness}`, (deviceAddress, message) => {
        console.log('STARTING THE BUSINESS REQUEST');

        self.insertFundingNodeMessage(deviceAddress, self.commands.startingTheBusiness).then(() => {
            if (message.messageBody && message.messageBody.pairCode) {
                return self.updatePairCode(deviceAddress, message.messageBody.pairCode);
            } else {
                return Promise.resolve();
            }
        }).then(() => {
            self.deviceManager.sendResponse(
                deviceAddress,
                self.commands.startingTheBusiness,
                {},
                message.id
            );
        });
    });

    // ALIVE_AND_WELL
    self.eventBus.on(`dagcoin.request.${self.commands.aliveAndWell}`, (deviceAddress, message) => {
        self.insertFundingNodeMessage(deviceAddress, self.commands.aliveAndWell).then(() => {
            if (message.messageBody && message.messageBody.pairCode) {
                return self.updatePairCode(deviceAddress, message.messageBody.pairCode);
            } else {
                return Promise.resolve();
            }
        }).then(() => {
            self.deviceManager.sendResponse(
                deviceAddress,
                self.commands.aliveAndWell,
                {},
                message.id
            );
        });
    });

    // UPDATE SETTINGS
    self.eventBus.on(`dagcoin.request.${self.commands.updateSettings}`, (deviceAddress, message) => {
        self.insertFundingNodeMessage(deviceAddress, self.commands.updateSettings).then(() => {
            if (message.messageBody && message.messageBody.settings) {
                this.updateSettings(deviceAddress, message.messageBody.settings);
            } else {
                return Promise.resolve();
            }
        }).then(() => {
            self.deviceManager.sendResponse(
                deviceAddress,
                self.commands.updateSettings,
                {},
                message.id
            );
        });
    });

    // OUT OF BUSINESS
    self.eventBus.on(`dagcoin.request.${self.commands.outOfBusiness}`, (deviceAddress, message) => {
        self.insertFundingNodeMessage(deviceAddress, self.commands.outOfBusiness).then(() => {
            self.deviceManager.sendResponse(
                deviceAddress,
                self.commands.outOfBusiness,
                {},
                message.id
            );
        });
    });

    // TEMPORARILY UNAVAILABLE
    self.eventBus.on(`dagcoin.request.${self.commands.temporarilyUnavailable}`, (deviceAddress, message) => {
        self.insertFundingNodeMessage(deviceAddress, self.commands.temporarilyUnavailable).then(() => {
            self.deviceManager.sendResponse(
                deviceAddress,
                self.commands.temporarilyUnavailable,
                {},
                message.id
            );
        });
    });

    console.log('FINISHED REGISTERING LISTENERS WITHIN THE DISCOVERY SERVICE');
}

DiscoveryService.prototype.insertFundingNodeMessage = function (deviceAddress, status) {
    if (
        this.commands.startingTheBusiness !== status &&
        this.commands.temporarilyUnavailable !== status &&
        this.commands.outOfBusiness !== status &&
        this.commands.aliveAndWell !== status
    ) {
        return Promise.resolve();
    }

    const self = this;

    if (deviceAddress !== self.conf.FUNDING_HUB_ADDRESS) {
        console.log(`UNKNOWN FUNDING NODE (${deviceAddress}) SENT ${status}`);
        return Promise.reject(`UNKNOWN FUNDING NODE (${deviceAddress}) SENT ${status}`);
    }

    return self.dbManager.query(
        "SELECT device_address FROM funding_nodes WHERE device_address=?",
        [deviceAddress]
    ).then((rows) => {
        if (rows.length > 0) {
            return self.dbManager.query(
                "UPDATE funding_nodes SET status=?, status_date=DATETIME('now') WHERE device_address=?",
                [status, deviceAddress]
            );
        } else {
            return self.dbManager.query(
                "INSERT INTO funding_nodes (status, device_address) VALUES (?,?)",
                [status, deviceAddress]
            );
        }
    });
};

DiscoveryService.prototype.updateSettings = function (deviceAddress, settings) {
    return this.dbManager.query(
        "UPDATE funding_nodes SET exchange_fee=?, total_bytes=?, bytes_per_address=?, max_end_user_capacity=? WHERE device_address=?",
        [
            settings.exchangeFee,
            settings.totalBytes,
            settings.bytesPerAddress,
            settings.maxEndUserCapacity,
            deviceAddress
        ]
    );
};

DiscoveryService.prototype.updatePairCode = function (deviceAddress, pairCode) {
    return this.dbManager.query(
        "UPDATE funding_nodes SET pair_code=? WHERE device_address=?",
        [pairCode, deviceAddress]
    );
};

DiscoveryService.prototype.getListOfFundingNodes = function (deviceAddress) {
    return this.dbManager.query(
        "SELECT device_address, exchange_fee, pair_code FROM funding_nodes WHERE device_address <> ? AND status = 'ALIVE_AND_WELL' AND DATETIME(status_date, '+10 minutes') > DATETIME('now')",
        [deviceAddress]
    ).then((rows) => {
        if (rows.length > 0) {
            const result = [];

            for (let i = 0; i < rows.length; i++) {
                result.push({
                    deviceAddress: rows[i].device_address,
                    exchangeFee: rows[i].exchange_fee,
                    pairCode: rows[i].pair_code
                });
            }

            return Promise.resolve(result);
        } else {
            return Promise.resolve(null);
        }
    });
};

module.exports = DiscoveryService;
module.exports.getInstance = function () {
    if (!instance) {
        instance = new DiscoveryService();
    }

    return instance;
};