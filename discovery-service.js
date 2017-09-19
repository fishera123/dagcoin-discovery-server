"use strict";
exports.eventBus = null;
exports.device = null;
exports.db = null;

exports.commands = {
    startingTheBusiness: 'STARTING_THE_BUSINESS',
    aliveAndWell: 'ALIVE_AND_WELL',
    temporarilyUnavailable: 'TEMPORARILY_UNAVAILABLE',
    outOfBusiness: 'OUT_OF_BUSINESS',
    listTraders: 'LIST_TRADERS',
    updateSettings: 'UPDATE_SETTINGS',
    unrecognized: 'UNRECOGNIZED'
};

exports.sendResponse = (deviceAddress, message, response) => {
    const self = this;

    response.protocol = 'dagcoin';

    if (message) {
        console.log(`REACTING TO A ${message.messageType} REQUEST`);

        if (message.messageType) {
            response.messageType = message.messageType;
            response.title = `response.${message.messageType}`;
        }

        if (typeof message.id !== "undefined") {
            response.id = message.id;
        }
    } else {
        console.log(`REACTING TO AN UNEXPECTED REQUEST`);
    }

    return new Promise((resolve, reject) => {
        self.device.sendMessageToDevice(
            deviceAddress,
            'text',
            JSON.stringify(response),
            {
                onSaved: function () {
                    console.log(`A ${response.messageType} MESSAGE WAS SAVED INTO THE DATABASE`);
                },
                ifOk: function () {
                    resolve();
                },
                ifError: function (err) {
                    reject(`COULD NOT DELIVER A ${message.messageType} MESSAGE. REASON: ${err}`)
                }
            }
        );
    });
};

exports.insertFundingNodeMessage = (deviceAddress, status) => {
    if (this.commands.startingTheBusiness !== status &&
        this.commands.temporarilyUnavailable !== status &&
        this.commands.outOfBusiness !== status &&
        this.commands.aliveAndWell !== status) {
        return;
    }

    const self = this;

    this.db.query(
        "SELECT device_address FROM funding_nodes WHERE device_address=?",
        [deviceAddress],
        function(rows){
            if (rows.length > 0){
                self.db.query("UPDATE funding_nodes SET status=?, status_date=DATETIME('now') WHERE device_address=?", [status, deviceAddress]);
            }
            else{
                self.db.query("INSERT INTO funding_nodes (status, device_address) VALUES (?,?)", [status, deviceAddress]);
            }
        }
    );
};

exports.updateSettings = (deviceAddress, settings) => {
    this.db.query(
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

exports.updatePairCode = (deviceAddress, pairCode) => {
    this.db.query("UPDATE funding_nodes SET pair_code=? WHERE device_address=?", [pairCode, deviceAddress]);
};

exports.getListOfFundingNodes = (deviceAddress, callBack) => {
    return new Promise((resolve) => {
        const result = [];

        this.db.query(
            "SELECT device_address, exchange_fee, pair_code FROM funding_nodes WHERE device_address <> ? AND status = 'ALIVE_AND_WELL' AND DATETIME(status_date, '+10 minutes') > DATETIME('now')",
            [deviceAddress],
            function(rows){
                if (rows.length > 0) {
                    for (let i = 0; i < rows.length; i++) {
                        result.push({
                            deviceAddress: rows[i].device_address,
                            exchangeFee: rows[i].exchange_fee,
                            pairCode: rows[i].pair_code
                        });
                    }

                    resolve(result);
                } else {
                    resolve(null);
                }
            }
        );
    });
};

exports.init = () => {
    this.eventBus = require('byteballcore/event_bus.js');
    this.device = require('byteballcore/device.js');
    this.db = require('byteballcore/db.js');

    const self = this;

    console.log('REGISTERING LISTENERS WITHIN THE DISCOVERY SERVICE');

    // LIST_TRADERS
    this.eventBus.on(`dagcoin.request.${this.commands.listTraders}`, (deviceAddress, message) => {
        self.getListOfFundingNodes(deviceAddress).then((listOfNodes) => {
            self.sendResponse(deviceAddress, message, {messageBody: {traders: listOfNodes || []}});
        });
    });

    // STARTING THE BUSINESS
    this.eventBus.on(`dagcoin.request.${this.commands.startingTheBusiness}`, (deviceAddress, message) => {
        self.insertFundingNodeMessage(deviceAddress, message.messageType);

        if (message.messageBody && message.messageBody.pairCode) {
            this.updatePairCode(deviceAddress, message.messageBody.pairCode);
        }

        self.sendResponse(deviceAddress, message, {});
    });

    // ALIVE_AND_WELL
    this.eventBus.on(`dagcoin.request.${this.commands.aliveAndWell}`, (deviceAddress, message) => {
        self.insertFundingNodeMessage(deviceAddress, message.messageType);

        if (message.messageBody && message.messageBody.pairCode) {
            this.updatePairCode(deviceAddress, message.messageBody.pairCode);
        }

        self.sendResponse(deviceAddress, message, {});
    });

    // UPDATE SETTINGS
    this.eventBus.on(`dagcoin.request.${this.commands.updateSettings}`, (deviceAddress, message) => {
        self.insertFundingNodeMessage(deviceAddress, message.messageType);

        const settings = message.messageBody.settings;

        if (settings) {
            this.updateSettings(deviceAddress, settings);
        }

        self.sendResponse(deviceAddress, message, {});
    });

    // OUT OF BUSINESS
    this.eventBus.on(`dagcoin.request.${this.commands.outOfBusiness}`, (deviceAddress, message) => {
        self.insertFundingNodeMessage(deviceAddress, message.messageType);

        self.sendResponse(deviceAddress, message, {});
    });

    // TEMPORARILY UNAVAILABLE
    this.eventBus.on(`dagcoin.request.${this.commands.temporarilyUnavailable}`, (deviceAddress, message) => {
        self.insertFundingNodeMessage(deviceAddress, message.messageType);

        self.sendResponse(deviceAddress, message, {});
    });

    console.log('FINISHED REGISTERING LISTENERS WITHIN THE DISCOVERY SERVICE');
};
