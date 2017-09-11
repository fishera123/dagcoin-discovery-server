"use strict";

var DiscoveryService = function (device, db) {
    const commands = {
        startingTheBusiness: 'STARTING_THE_BUSINESS',
        aliveAndWell: 'ALIVE_AND_WELL',
        temporarilyUnavailable: 'TEMPORARILY_UNAVAILABLE',
        outOfBusiness: 'OUT_OF_BUSINESS',
        listTraders: 'LIST_TRADERS',
        updateSettings: 'UPDATE_SETTINGS',
        unrecognized: 'UNRECOGNIZED'
    };

    function sendMessageToDevice(deviceAddress, text){
        device.sendMessageToDevice(deviceAddress, 'text', text);
    }

    function sendResponse(deviceAddress, response){
        response.protocol = 'dagcoin';
        response.title = `response.${response.messageType}`;

        var text = JSON.stringify(response);
        
        sendMessageToDevice(deviceAddress, text);
    }

    function insertFundingNodeMessage(deviceAddress, status){
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

    function updateSettings(deviceAddress, settings){
        db.query("UPDATE funding_nodes SET exchange_fee=?, total_bytes=?, bytes_per_address=?, max_end_user_capacity=? WHERE device_address=?",
            [
                settings.exchangeFee,
                settings.totalBytes,
                settings.bytesPerAddress,
                settings.maxEndUserCapacity,
                deviceAddress
            ]);
    }

    function updatePairCode(deviceAddress, pairCode){
        db.query("UPDATE funding_nodes SET pair_code=? WHERE device_address=?", [pairCode, deviceAddress]);
    }

    function getListOfFundingNodes(deviceAddress, callBack){
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

    function isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    function processCommand(deviceAddress, message){
        if (!message) {
            sendResponse(deviceAddress, {messageType: commands.unrecognized, messageBody: { request: 'EMPTY REQUEST' }, success: false});
            return;
        }

        if (!message.messageType) {
            sendResponse(deviceAddress, {messageType: commands.unrecognized, messageBody: { request: 'NO MESSAGE TYPE' }, success: false});
            return;
        }

        const command = message.messageType.toUpperCase();

        var response = {
            messageType: command,
            messageBody: null,
            success: true
        };

        insertFundingNodeMessage(deviceAddress, command);

        switch (command) {
            case commands.startingTheBusiness:
            case commands.temporarilyUnavailable:
            case commands.outOfBusiness:
                break;
            case commands.aliveAndWell:
                if (message.messageBody && message.messageBody.pairCode){
                    updatePairCode(deviceAddress, message.messageBody.pairCode);
                }
                break;
            case commands.listTraders:
                getListOfFundingNodes(deviceAddress, function(listOfNodes){
                    var nodes = listOfNodes || [];
                    response.messageBody = {traders: nodes};
                    sendResponse(deviceAddress, response);
                });
                return;
            case commands.updateSettings:
                var settings = message.messageBody.settings;

                if (settings){
                    updateSettings(deviceAddress, settings);
                }
                break;
            default:
                response = {messageType: 'UNRECOGNIZED', messageBody: { command: command, request: text }, success: false};
                break;
        }

        sendResponse(deviceAddress, response);
    }

    return {
        processCommand: processCommand,
        commands: commands
	}
};

exports.DiscoveryService = DiscoveryService;