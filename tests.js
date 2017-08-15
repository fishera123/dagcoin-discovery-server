"use strict";
var device = {
    sendMessageToDevice: function (deviceAddress, event, text) {
        console.log('address: ' + deviceAddress);
        console.log('response: ' + JSON.stringify(text));
    }
};

var ds = require('./discovery-service.js');
var discoveryService = ds.DiscoveryService(device);

var queue = [];
var interval = setInterval(function() {
    var func = queue.shift();

    if (func != null) {
        func();
    }
}, 2000);

function sendRequest(deviceAddress, text) {
    queue.push(function () {
        console.log('*************************************************************************');
        console.log('*************************************************************************');
        console.log('*************************************************************************');
        console.log('request: ' + text);
        discoveryService.processCommand(deviceAddress, text);
    });
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
//list_traders
sendRequest("TEST_ADDRESS_2", JSON.stringify({messageType: discoveryService.commands.listTraders}));
//update_settings
sendMessage(discoveryService.commands.updateSettings, {
	settings: {
        exchangeFee: 0.013,
        totalBytes: 666,
        bytesPerAddress: 140,
        maxEndUserCapacity: 5
    }
});
//invlaid json
sendRequest("TEST_ADDRESS", "IVALID_JSON");
//invlaid command
sendMessage("IVALID_COMMAND");
//outOfBusiness
sendMessage(discoveryService.commands.outOfBusiness);
//list_traders
sendRequest("TEST_ADDRESS_2", JSON.stringify({messageType: discoveryService.commands.listTraders}));

