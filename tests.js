"use strict";
var ds = require('./discovery-service.js');

var device = {
	sendMessageToDevice: function (deviceAddress, event, text) {
		console.log('address: ' + deviceAddress);
		console.log('response: ' + JSON.stringify(text));
	}
};

var discoveryService = ds.DiscoveryService(device);

function sendRequest(deviceAddress, text) {
    console.log('*************************************************************************');
    console.log('*************************************************************************');
    console.log('*************************************************************************');
    console.log('request: ' + text);
    discoveryService.processCommand(deviceAddress, text);
}

function sendMessage(messageType, messageBody) {
    sendRequest(
		"TEST_ADDRESS",
		JSON.stringify({
            messageType: messageType,
            messageBody: messageBody
        })
	);
}

//startingTheBusiness
sendMessage(discoveryService.commands.startingTheBusiness);
//aliveAndWell
sendMessage(discoveryService.commands.aliveAndWell, { pairCode: "TEST_PAIR_CODE" });
//outOfBusiness
sendMessage(discoveryService.commands.outOfBusiness);
//list_traders
sendMessage(discoveryService.commands.listTraders);
//update_settings
sendMessage(discoveryService.commands.updateSettings, {
	exchangeFee: 0.013,
    totalBytes: 666,
    bytesPerAddress: 140,
    maxEndUserCapacity: 5
});
//invlaid json
sendRequest("TEST_ADDRESS", "IVALID_JSON");
//invlaid command
sendMessage("IVALID_COMMAND");