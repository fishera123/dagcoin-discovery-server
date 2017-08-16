describe('discovery-service', function (){
    var device = null;
    var db = null;
    var ds = null;
    var discoveryService = null;
    var deviceAddress = null;
    var invokedSqlQueries = null;
    var sqlQueries = null;

    function sendMessage(messageType, messageBody) {
        discoveryService.processCommand(
            deviceAddress,
            JSON.stringify({
                messageType: messageType,
                messageBody: messageBody
            }));
    }

    beforeEach(function () {
        sqlQueries = [];
        invokedSqlQueries = [];
        deviceAddress = "TEST_ADDRESS";

        device = {
            sendMessageToDevice: function (da, event, text) {
                //logic
                expect(da).toEqual(deviceAddress);
                expect(invokedSqlQueries).toEqual(sqlQueries);

                if (this.sendMessageToDeviceCallback) {
                    this.sendMessageToDeviceCallback(da, event, text);
                }
            },
            sendMessageToDeviceCallback: function() {

            }
        };

        db = {
            query: function(sqlQuery, params, callback) {
                invokedSqlQueries.push(sqlQuery.toLowerCase());

                if (this.queryCallback) {
                    this.queryCallback(sqlQuery, params, callback);
                }
            },
            queryCallback: function(sqlQuery, params, callback) {
                if (callback) {
                    callback([]);
                }
            }
        };

        ds = require('../../discovery-service.js');
        discoveryService = ds.DiscoveryService(device, db);
    });

    afterEach(function() {

    });

    it('starting-the-business', function(done) {
        sqlQueries = [
            'SELECT device_address FROM funding_nodes WHERE device_address=?'.toLowerCase(),
            'UPDATE funding_nodes SET status=?, status_date=DATETIME(\'now\') WHERE device_address=?'.toLowerCase()
        ];

        db.queryCallback = function(q, p, cb) {
            if (q.toLowerCase() === 'SELECT device_address FROM funding_nodes WHERE device_address=?'.toLowerCase() && cb) {
                cb([{}]);
            }
        };

        device.sendMessageToDeviceCallback = function(da, ev, txt) {
            expect(txt).toEqual("{\"messageType\":\"STARTING_THE_BUSINESS\",\"messageBody\":null,\"success\":true}");
            done();
        };

        sendMessage(discoveryService.commands.startingTheBusiness);
    });

    it('alive-and-well', function(done) {
        sqlQueries = [
            'SELECT device_address FROM funding_nodes WHERE device_address=?'.toLowerCase(),
            'INSERT INTO funding_nodes (status, device_address) VALUES (?,?)'.toLowerCase(),
            'update funding_nodes set pair_code=? where device_address=?'.toLowerCase()
        ];

        device.sendMessageToDeviceCallback = function(da, ev, txt) {
            expect(txt).toEqual("{\"messageType\":\"ALIVE_AND_WELL\",\"messageBody\":null,\"success\":true}");
            done();
        };

        sendMessage(discoveryService.commands.aliveAndWell, { pairCode: "TEST_PAIR_CODE" });
    });

    it('list-traders', function(done) {
        sqlQueries = [
            'SELECT device_address, exchange_fee, pair_code FROM funding_nodes WHERE device_address <> ? AND status = \'ALIVE_AND_WELL\' AND DATETIME(status_date, \'+10 minutes\') > DATETIME(\'now\')'.toLowerCase()
        ];

        device.sendMessageToDeviceCallback = function(da, ev, txt) {
            expect(txt).toEqual("{\"messageType\":\"LIST_TRADERS\",\"messageBody\":{\"traders\":[]},\"success\":true}");
            done();
        };

        sendMessage(discoveryService.commands.listTraders);
    });

    it('update-settings', function(done) {
        sqlQueries = [
            'UPDATE funding_nodes SET exchange_fee=?, total_bytes=?, bytes_per_address=?, max_end_user_capacity=? WHERE device_address=?'.toLowerCase()
        ];

        device.sendMessageToDeviceCallback = function(da, ev, txt) {
            expect(txt).toEqual("{\"messageType\":\"UPDATE_SETTINGS\",\"messageBody\":null,\"success\":true}");
            done();
        };

        sendMessage(discoveryService.commands.updateSettings, {
            settings: {
                exchangeFee: 0.013,
                totalBytes: 666,
                bytesPerAddress: 140,
                maxEndUserCapacity: 5
            }
        });
    });

    it('invalid-json', function(done) {
        device.sendMessageToDeviceCallback = function(da, ev, txt) {
            expect(txt).toEqual("{\"messageType\":\"UNRECOGNIZED\",\"messageBody\":{\"request\":\"IVALID_JSON\"},\"success\":false}");
            done();
        };

        discoveryService.processCommand(deviceAddress, "IVALID_JSON");
    });

    it('invalid-command', function(done) {
        device.sendMessageToDeviceCallback = function(da, ev, txt) {
            expect(txt).toEqual("{\"messageType\":\"UNRECOGNIZED\",\"messageBody\":{\"command\":\"IVALID_COMMAND\",\"request\":\"{\\\"messageType\\\":\\\"IVALID_COMMAND\\\"}\"},\"success\":false}");
            done();
        };

        sendMessage("IVALID_COMMAND");
    });

    it('out-of-business', function(done) {
        sqlQueries = [
            'SELECT device_address FROM funding_nodes WHERE device_address=?'.toLowerCase(),
            'INSERT INTO funding_nodes (status, device_address) VALUES (?,?)'.toLowerCase()
        ];

        device.sendMessageToDeviceCallback = function(da, ev, txt) {
            expect(txt).toEqual("{\"messageType\":\"OUT_OF_BUSINESS\",\"messageBody\":null,\"success\":true}");
            done();
        };

        sendMessage(discoveryService.commands.outOfBusiness);
    });
});

