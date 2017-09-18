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

exports.sendResponse = (deviceAddress, response) => {
    const self = this;

    response.protocol = 'dagcoin';
    response.title = `response.${response.messageType}`;

    return new Promise((resolve, reject) => {
        self.device.sendMessageToDevice(
            deviceAddress,
            'text',
            JSON.stringify(response),
            {
                onSaved: function () {
                    console.log(`A ${message.messageType} MESSAGE WAS SAVED INTO THE DATABASE`);
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
}

exports.insertFundingNodeMessage = (deviceAddress, status) => {
    if (this.commands.startingTheBusiness !== status &&
        this.commands.temporarilyUnavailable !== status &&
        this.commands.outOfBusiness !== status &&
        this.commands.aliveAndWell !== status) {
        return;
    }

    db.query(
        "SELECT device_address FROM funding_nodes WHERE device_address=?",
        [deviceAddress],
        function(rows){
            if (rows.length > 0){
                this.db.query("UPDATE funding_nodes SET status=?, status_date=DATETIME('now') WHERE device_address=?", [status, deviceAddress]);
            }
            else{
                this.db.query("INSERT INTO funding_nodes (status, device_address) VALUES (?,?)", [status, deviceAddress]);
            }
        }
    );
}

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
}

exports.updatePairCode = (deviceAddress, pairCode) => {
    this.db.query("UPDATE funding_nodes SET pair_code=? WHERE device_address=?", [pairCode, deviceAddress]);
}

exports.getListOfFundingNodes = (deviceAddress, callBack) => {
    return new Promise((resolve) => {
        var result = [];

        this.db.query(
            "SELECT device_address, exchange_fee, pair_code FROM funding_nodes WHERE device_address <> ? AND status = 'ALIVE_AND_WELL' AND DATETIME(status_date, '+10 minutes') > DATETIME('now')",
            [deviceAddress],
            function(rows){
                if (rows.length > 0) {
                    for (var i = 0; i < rows.length; i++) {
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
}

exports.processCommand = (deviceAddress, message) => {
    if (!message) {
        this.sendResponse(deviceAddress, {messageType: this.commands.unrecognized, messageBody: { request: 'EMPTY REQUEST' }, success: false});
        return;
    }

    if (!message.messageType) {
        this.sendResponse(deviceAddress, {messageType: this.commands.unrecognized, messageBody: { request: 'NO MESSAGE TYPE' }, success: false});
        return;
    }

    const command = message.messageType.toUpperCase();

    var response = {
        messageType: command,
        messageBody: null,
        success: true
    };

    this.insertFundingNodeMessage(deviceAddress, command);

    switch (command) {
        // case this.commands.startingTheBusiness:
        case this.commands.temporarilyUnavailable:
        case this.commands.outOfBusiness:
            break;
        /*case this.commands.aliveAndWell:
            if (message.messageBody && message.messageBody.pairCode){
                this.updatePairCode(deviceAddress, message.messageBody.pairCode);
            }
            break;
        case this.commands.listTraders:
            this.getListOfFundingNodes(deviceAddress, function(listOfNodes){
                var nodes = listOfNodes || [];
                response.messageBody = {traders: nodes};
                this.sendResponse(deviceAddress, response);
            });
            return;
        case this.commands.updateSettings:
            var settings = message.messageBody.settings;

            if (settings){
                this.updateSettings(deviceAddress, settings);
            }
            break;*/
        default:
            response = {messageType: 'UNRECOGNIZED', messageBody: { command: command, request: text }, success: false};
            break;
    }

    this.sendResponse(deviceAddress, response);
}

exports.init = () => {
    this.eventBus = require('byteballcore/event_bus.js');
    this.device = require('byteballcore/device.js');
    this.db = require('byteballcore/db.js');

    const self = this;

    console.log('REGISTERING LISTENERS WITHIN THE DISCOVERY SERVICE');

    // LIST_TRADERS
    this.eventBus.on(`dagcoin.request.${this.commands.listTraders}`, (deviceAddress, message) => {
        console.log(`REACTING TO A ${message.messageType} REQUEST`);

        self.getListOfFundingNodes(deviceAddress).then((listOfNodes) => {
            var nodes = listOfNodes || [];

            const response = {
                messageType: message.messageType,
                traders: nodes
            };

            if(message.id) {
                response.id = message.id;
            }

            self.sendResponse(deviceAddress, response);
        });
    });

    // STARTING THE BUSINESS
    this.eventBus.on(`dagcoin.request.${this.commands.startingTheBusiness}`, (deviceAddress, message) => {
        console.log(`REACTING TO A ${message.messageType} REQUEST`);

        if (message.messageBody && message.messageBody.pairCode) {
            this.updatePairCode(deviceAddress, message.messageBody.pairCode);
        }

        const response = {
            messageType: message.messageType
        };

        if(message.id) {
            response.id = message.id;
        }

        self.sendResponse(deviceAddress, response);
    });

    // ALIVE_AND_WELL
    this.eventBus.on(`dagcoin.request.${this.commands.aliveAndWell}`, (deviceAddress, message) => {
        console.log(`REACTING TO A ${message.messageType} REQUEST`);

        if (message.messageBody && message.messageBody.pairCode) {
            this.updatePairCode(deviceAddress, message.messageBody.pairCode);
        }

        const response = {
            messageType: message.messageType
        };

        if(message.id) {
            response.id = message.id;
        }

        self.sendResponse(deviceAddress, response);
    });

    // UPDATE SETTINGS
    this.eventBus.on(`dagcoin.request.${this.commands.updateSettings}`, (deviceAddress, message) => {
        console.log(`REACTING TO A ${message.messageType} REQUEST`);

        var settings = message.messageBody.settings;

        if (settings) {
            this.updateSettings(deviceAddress, settings);
        }

        const response = {
            messageType: message.messageType
        };

        if(message.id) {
            response.id = message.id;
        }

        self.sendResponse(deviceAddress, response);
    });

    console.log('FINISHED REGISTERING LISTENERS WITHIN THE DISCOVERY SERVICE');
}
