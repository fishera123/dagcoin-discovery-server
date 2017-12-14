/*jslint node: true */
"use strict";

const accountManager = require('dagcoin-core/lib/accountManager').getInstance();
const exceptionManager = require('dagcoin-core/lib/exceptionManager');
const eventBus = require('byteballcore/event_bus.js');
const databaseManager = require('dagcoin-core/lib/databaseManager').getInstance();
const Raven = require('raven');
const conf = require('byteballcore/conf');
const osManager = require('dagcoin-core/lib/operatingSystemManager').getInstance();

if (conf.sentryUrl) {
    Raven.config(conf.sentryUrl, {
        sendTimeout: 5,
        environment: conf.environment
    }).install();
}

databaseManager.onReady().then(() => {
    return databaseManager.checkOrUpdateDatabase();
}).then(() => {
  return accountManager.readAccount().then(() => {
    if(conf.environment == 'dev') {
      startListeningDevServer();
    }
    eventBus.on('paired', function (deviceAddress) {
      console.log(`PAIR REQUEST FROM ${deviceAddress}`);
    });
  });
}).catch((e) => {
  exceptionManager.logError(e);
  Raven.captureException(e);
  osManager.shutDown();
});

function startListeningDevServer() {
  const express = require('express');
  const app = express();

  // This responds a GET request for getting discovery service pairing code, since it changes every time you run devnet.
  app.get('/getPairingCode', function (req, res) {
    console.log(`WILL PAIR WITH DISCOVERY SERVICE USING ${accountManager.getPairingCode()}`);
    res.json(accountManager.getPairingCode());
    res.end();
  });

  const server = app.listen(7000, function () {
    const host = server.address().address
    const port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
  });
}
