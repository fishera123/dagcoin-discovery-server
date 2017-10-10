/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = true;
exports.bIgnoreUnpairRequests = true;

exports.storage = 'sqlite';

exports.hub = 'byteball.org/bb-test';
exports.deviceName = 'Testnet-Discovery-Service';
exports.permanent_pairing_secret = '0000'; //dCHcrhoJq56t
exports.control_addresses = [];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.KEYS_FILENAME = 'keys.json';

exports.PASSPHRASE = 'Av3ryunique0rE'; //a1inc1McvriH

exports.port = 7000

console.log('Finished server configuration');