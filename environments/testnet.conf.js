/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = true;
exports.bIgnoreUnpairRequests = true;

exports.storage = 'sqlite';

exports.sentryUrl = 'https://1092710facda45fc947d0541b549e489:a89a8dda6a614139b277eaa93a366182@sentry.io/241489';
exports.env = 'testnet';
exports.hub = 'byteball.org/bb-test';
exports.deviceName = 'Testnet-Discovery-Service';
exports.permanent_pairing_secret = '0000'; //dCHcrhoJq56t
exports.control_addresses = [];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.KEYS_FILENAME = 'keys.json';

exports.PASSPHRASE = 'Av3ryunique0rE'; //a1inc1McvriH

exports.port = 7000;

// temporary solution, until we have only one funding hub
exports.FUNDING_HUB_ADDRESS = '0A5DATV2A3XFAWFMHZUT7DJXZTZRAD6G2';

console.log('Finished server configuration');
