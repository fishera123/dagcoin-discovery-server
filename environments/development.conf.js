/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = true;
exports.bIgnoreUnpairRequests = true;

exports.storage = 'sqlite';

exports.hub = 'byteball.org/bb-test';
exports.deviceName = 'Development-Discovery-Service';
exports.permanent_pairing_secret = '0000'; //JKBZaJXGtM04
exports.control_addresses = [];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.KEYS_FILENAME = 'keys.json';

exports.PASSPHRASE = '123'; //k5FKBpwOrPfu

exports.port = 7000;

// temporary solution, until we have only one funding hub
exports.FUNDING_HUB_ADDRESS = '0EVJ4QGKRLRJGWSQ553UFKDTNRLUH4YOW';

console.log('Finished server configuration');