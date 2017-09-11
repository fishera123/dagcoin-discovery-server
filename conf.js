/*jslint node: true */
"use strict";

exports.bServeAsHub = false;
exports.bLight = false;
exports.bIgnoreUnpairRequests = true;

exports.storage = 'sqlite';


exports.hub = 'byteball.org/bb-test';
exports.deviceName = 'Headless';
exports.permanent_pairing_secret = '0000';
exports.control_addresses = ['BX53JJ55D6SSVKTH2H44THOZWM4IGTZS'];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.KEYS_FILENAME = 'keys.json';

exports.PASSPHRASE = 'ILAGIN';

console.log('Finished server configuration');