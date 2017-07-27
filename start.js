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

function sendUnrecognizedCommand(deviceAddress){
	sendMessageToDevice(deviceAddress, 'Unrecognized command');
}

function insertFundingNodeMessage(deviceAddress, status){
	db.query("DELETE FROM funding_nodes WHERE device_address=?", [deviceAddress]);
	db.query("INSERT INTO funding_nodes (status, device_address) VALUES (?,?)", [status, deviceAddress]);
}

function getListOfFundingNodes(callBack){
	var result = [];
	
	db.query(
		"SELECT device_address FROM funding_nodes WHERE status = 'ALIVE_AND_WELL' AND DATETIME(status_date, '+10 minutes') > DATETIME('now')", 
		[], 
		function(rows){
			if (rows.length > 0){
				for (var i = 0; i < rows.length; i++) {
					result.push(rows[i].device_address);
					
					return callBack(result);
				}
			}
			else{
				return callBack(null);
			}
		}
	);
}

function processCommand(deviceAddress, text){
	var command = text.toUpperCase();
	
	if (command === 'STARTING_THE_BUSINESS'){
		insertFundingNodeMessage(deviceAddress, command);
	} else if (command === 'ALIVE_AND_WELL'){
		insertFundingNodeMessage(deviceAddress, command);
	}else if (command === 'TEMPORARILY_UNAVAILABLE'){
		insertFundingNodeMessage(deviceAddress, command);
	}else if (command === 'OUT_OF_BUSINESS'){
		insertFundingNodeMessage(deviceAddress, command);
	}else if (command === 'LIST_TRADERS'){
		getListOfFundingNodes(function(listOfNodes){
			if (listOfNodes){
				var listOfNodesFormatted = listOfNodes.join('\n');
				
				sendMessageToDevice(deviceAddress, listOfNodesFormatted);
			}
			else{
				sendMessageToDevice(deviceAddress, 'There are no funding nodes');
			}
		});
	} else{
		sendUnrecognizedCommand(deviceAddress);
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