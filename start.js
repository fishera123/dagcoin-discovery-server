/*jslint node: true */
"use strict";
var constants = require('byteballcore/constants.js');
var conf = require('byteballcore/conf.js');
var db = require('byteballcore/db.js');
var eventBus = require('byteballcore/event_bus.js');
var headlessWallet = require('headless-byteball');
var ValidationUtils = require("byteballcore/validation_utils.js");

function sendMessageToDevice(deviceAddress, text){
	var device = require('byteballcore/device.js');
	
	device.sendMessageToDevice(deviceAddress, 'text', text);
}

function sendUnrecognizedCommand(deviceAddress, command){
	var result = {messageType: 'UNRECOGNIZED', messageBody: {command: command}};
	
	sendMessageToDevice(deviceAddress, result);
}

function insertFundingNodeMessage(deviceAddress, status){
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
					
					return callBack(result);
				}
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

function formatListOfNodes(listOfNodes){
	var traders = {messageType: 'LIST_TRADERS', messageBody: {traders: listOfNodes}};
	var result = JSON.stringify(traders);	
	
	return result;
}

function processCommand(deviceAddress, text){
	if (!isJsonString(text)){
		return sendUnrecognizedCommand(deviceAddress, text);
	}
	
	var message = JSON.parse(text);
	
	if (!message || !message.messageType){
		return sendUnrecognizedCommand(deviceAddress, text);
	}
	
	var command = message.messageType.toUpperCase();
	
	if (command === 'STARTING_THE_BUSINESS'){
		insertFundingNodeMessage(deviceAddress, command);
	} else if (command === 'ALIVE_AND_WELL'){
		var pairCode = message.messageBody.pairCode;
		
		insertFundingNodeMessage(deviceAddress, command);
		
		if (pairCode){
			updatePairCode(deviceAddress, pairCode);
		}
	}else if (command === 'TEMPORARILY_UNAVAILABLE'){
		insertFundingNodeMessage(deviceAddress, command);
	}else if (command === 'OUT_OF_BUSINESS'){
		insertFundingNodeMessage(deviceAddress, command);
	}else if (command === 'LIST_TRADERS'){
		getListOfFundingNodes(deviceAddress, function(listOfNodes){
			if (listOfNodes && listOfNodes.length > 0){
				var listOfNodesFormatted = formatListOfNodes(listOfNodes);
				
				sendMessageToDevice(deviceAddress, listOfNodesFormatted);
			}
			else{
				sendMessageToDevice(deviceAddress, formatListOfNodes([]));
			}
		});
	} else if(command === 'UPDATE_SETTINGS'){
		var settings = message.messageBody.settings;
		
		if (settings){
			updateSettings(deviceAddress, settings);
		}
	} 
	
	else{
		sendUnrecognizedCommand(deviceAddress, command);
	}
}

eventBus.on('paired', function(deviceAddress){
	if (headlessWallet.isControlAddress(deviceAddress)){
		headlessWallet.handlePairing(deviceAddress);
	}	
});

eventBus.on('text', function(deviceAddress, text){
	processCommand(deviceAddress, text);
});


module.exports = headlessWallet;