/*jslint node: true */
"use strict";

exports.environment='dev';

exports.bServeAsHub = false;
exports.bLight = true;
exports.bIgnoreUnpairRequests = true;

exports.storage = 'sqlite';

exports.hub = 'testnetexplorer.dagcoin.org/wss/';
exports.deviceName = 'Development-Discovery-Service';
exports.permanent_pairing_secret = '0000'; //JKBZaJXGtM04
exports.control_addresses = [];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.KEYS_FILENAME = 'keys.json';

exports.passPhrase = '123'; //k5FKBpwOrPfu

exports.port = 7000;

// temporary solution, until we have only one funding hub
exports.FUNDING_HUB_ADDRESS = '0EVJ4QGKRLRJGWSQ553UFKDTNRLUH4YOW';
exports.CONSOLIDATION_INTERVAL = 60 * 60 * 1000;
exports.DAGCOIN_MESSAGE_TIMEOUT = 30 * 1000;

exports.DATABASE_MIGRATION_TOOL = "native-queries"; // CAN BE native-queries OR db-migrate

console.log('Finished server configuration');