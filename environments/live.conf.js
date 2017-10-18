/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = true;
exports.bIgnoreUnpairRequests = true;

exports.storage = 'sqlite';

exports.hub = 'byteball.org/bb';
exports.deviceName = 'Livenet-Discovery-Service';
exports.permanent_pairing_secret = '0000'; //3mtSX6giZQLu
exports.control_addresses = [];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.KEYS_FILENAME = 'keys.json';

exports.PASSPHRASE = 'ILAGIN'; //WfwYsdXWJAFk

exports.port = 7000;

// temporary solution, until we have only one funding hub
exports.FUNDING_HUB_ADDRESS = '0565VHSI4BBNETCMSXLBZKYS5SAVB5ZK2';

console.log('Finished server configuration');