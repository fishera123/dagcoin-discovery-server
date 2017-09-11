"use strict";
var eventBus = require('byteballcore/event_bus.js');
const device = require('byteballcore/device.js');
var db = require('byteballcore/db.js');

exports.commands = {
    startingTheBusiness: 'STARTING_THE_BUSINESS',
    aliveAndWell: 'ALIVE_AND_WELL',
    temporarilyUnavailable: 'TEMPORARILY_UNAVAILABLE',
    outOfBusiness: 'OUT_OF_BUSINESS',
    listTraders: 'LIST_TRADERS',
    updateSettings: 'UPDATE_SETTINGS',
    unrecognized: 'UNRECOGNIZED'
};

exports.sendMessageToDevice = (deviceAddress, text) => {
    device.sendMessageToDevice(deviceAddress, 'text', text);
}

exports.sendResponse = (deviceAddress, response) => {
    response.protocol = 'dagcoin';
    response.title = `response.${response.messageType}`;

    var text = JSON.stringify(response);

    this.sendMessageToDevice(deviceAddress, text);
}

exports.insertFundingNodeMessage = (deviceAddress, status) => {
    if (commands.startingTheBusiness !== status &&
        commands.temporarilyUnavailable !== status &&
        commands.outOfBusiness !== status &&
        commands.aliveAndWell !== status) {
        return;
    }

    db.query(
        "SELECT device_address FROM funding_nodes WHERE device_address=?",
        [deviceAddress],
        function(rows){
            if (rows.length > 0){
                db.query("UPDATE funding_nodes SET status=?, status_date=DATETIME('now') WHERE device_address=?", [status, deviceAddress]);
            }
            else{
                db.query("INSERT INTO funding_nodes (status, device_address) VALUES (?,?)", [status, deviceAddress]);
            }
        }
    );
}

exports.updateSettings = (deviceAddress, settings) => {
    db.query(
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
    db.query("UPDATE funding_nodes SET pair_code=? WHERE device_address=?", [pairCode, deviceAddress]);
}

exports.getListOfFundingNodes = (deviceAddress, callBack) => {
    var result = [];

    db.query(
        "SELECT device_address, exchange_fee, pair_code FROM funding_nodes WHERE device_address <> ? AND status = 'ALIVE_AND_WELL' AND DATETIME(status_date, '+10 minutes') > DATETIME('now')",
        [deviceAddress],
        function(rows){
            if (rows.length > 0){
                for (var i = 0; i < rows.length; i++) {
                    result.push({
                        deviceAddress: rows[i].device_address,
                        exchangeFee: rows[i].exchange_fee,
                        pairCode: rows[i].pair_code
                    });
                }

                return callBack(result);
            }
            else{
                return callBack(null);
            }
        }
    );
}

exports.isJsonString = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

exports.processCommand = (deviceAddress, message) => {
    if (!message) {
        this.sendResponse(deviceAddress, {messageType: commands.unrecognized, messageBody: { request: 'EMPTY REQUEST' }, success: false});
        return;
    }

    if (!message.messageType) {
        this.sendResponse(deviceAddress, {messageType: commands.unrecognized, messageBody: { request: 'NO MESSAGE TYPE' }, success: false});
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
        case commands.startingTheBusiness:
        case commands.temporarilyUnavailable:
        case commands.outOfBusiness:
            break;
        case commands.aliveAndWell:
            if (message.messageBody && message.messageBody.pairCode){
                this.updatePairCode(deviceAddress, message.messageBody.pairCode);
            }
            break;
        case commands.listTraders:
            this.getListOfFundingNodes(deviceAddress, function(listOfNodes){
                var nodes = listOfNodes || [];
                response.messageBody = {traders: nodes};
                this.sendResponse(deviceAddress, response);
            });
            return;
        case commands.updateSettings:
            var settings = message.messageBody.settings;

            if (settings){
                this.updateSettings(deviceAddress, settings);
            }
            break;
        default:
            response = {messageType: 'UNRECOGNIZED', messageBody: { command: command, request: text }, success: false};
            break;
    }

    this.sendResponse(deviceAddress, response);
}

exports.registerListeners = () => {
    eventBus.on(`dagcoin.request.${commands.listTraders}`, (deviceAddress, message) => {
        var response = {
            messageType: commands.listTraders,
            messageBody: null,
            success: true
        };

        this.getListOfFundingNodes(deviceAddress, function(listOfNodes){
            var nodes = listOfNodes || [];
            response.messageBody = {traders: nodes};
            this.sendResponse(deviceAddress, response);
        });
    });
}
