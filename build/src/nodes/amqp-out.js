"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const types_1 = require("../types");
const Amqp_1 = require("../Amqp");
module.exports = function (RED) {
    function AmqpOut(config) {
        let reconnectTimeout;
        RED.events.once('flows:stopped', () => {
            clearTimeout(reconnectTimeout);
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        RED.nodes.createNode(this, config);
        this.status(constants_1.NODE_STATUS.Disconnected);
        const amqp = new Amqp_1.default(RED, this, config);
        (async function initializeNode(self) {
            const reconnect = () => new Promise(resolve => {
                reconnectTimeout = setTimeout(async () => {
                    try {
                        await initializeNode(self);
                        resolve();
                    }
                    catch (e) {
                        await reconnect();
                    }
                }, 2000);
            });
            try {
                const connection = await amqp.connect();
                // istanbul ignore else
                if (connection) {
                    await amqp.initialize();
                    self.on('input', async (msg, _, done) => {
                        var _a;
                        const { payload, routingKey, properties: msgProperties } = msg;
                        const { exchangeRoutingKey, exchangeRoutingKeyType, exchangeName, exchangeNameKeyType, amqpProperties, } = config;
                        // message properties override config properties
                        let properties;
                        try {
                            properties = Object.assign(Object.assign({}, JSON.parse(amqpProperties)), msgProperties);
                        }
                        catch (e) {
                            properties = msgProperties;
                        }
                        switch (exchangeRoutingKeyType) {
                            case 'env': {
                                amqp.setRoutingKey(process.env[config.exchangeRoutingKey]);
                                break;
                            }
                            case 'msg':
                            case 'flow':
                            case 'global':
                                amqp.setRoutingKey(RED.util.evaluateNodeProperty(exchangeRoutingKey, exchangeRoutingKeyType, self, msg));
                                break;
                            case 'jsonata':
                                amqp.setRoutingKey(RED.util.evaluateJSONataExpression(RED.util.prepareJSONataExpression(exchangeRoutingKey, self), msg));
                                break;
                            case 'str':
                            default:
                                if (routingKey) {
                                    // if incoming payload contains a routingKey value
                                    // override our string value with it.
                                    // Superfluous (and possibly confusing) at this point
                                    // but keeping it to retain backwards compatibility
                                    amqp.setRoutingKey(routingKey);
                                }
                                break;
                        }
                        switch (exchangeNameKeyType) {
                            case 'env': {
                                amqp.setExchangeName(process.env[config.exchangeName]);
                                break;
                            }
                            case 'msg':
                            case 'flow':
                            case 'global':
                                amqp.setExchangeName(RED.util.evaluateNodeProperty(exchangeName, exchangeNameKeyType, self, msg));
                                break;
                            case 'str':
                            default:
                                if (exchangeName) {
                                    // if incoming payload contains a routingKey value
                                    // override our string value with it.
                                    // Superfluous (and possibly confusing) at this point
                                    // but keeping it to retain backwards compatibility
                                    amqp.setExchangeName(exchangeName);
                                }
                                break;
                        }
                        if (!!((_a = properties === null || properties === void 0 ? void 0 : properties.headers) === null || _a === void 0 ? void 0 : _a.doNotStringifyPayload)) {
                            amqp.publish(payload, properties);
                        }
                        else {
                            amqp.publish(JSON.stringify(payload), properties);
                        }
                        done && done();
                    });
                    // When the node is re-deployed
                    self.once('close', async (done) => {
                        await amqp.close();
                        done && done();
                    });
                    // When the server goes down
                    connection.once('close', async (e) => {
                        e && (await reconnect());
                    });
                    self.status(constants_1.NODE_STATUS.Connected);
                }
            }
            catch (e) {
                if (e.code === types_1.ErrorType.ConnectionRefused || e.isOperational) {
                    await reconnect();
                }
                else if (e.code === types_1.ErrorType.InvalidLogin) {
                    self.status(constants_1.NODE_STATUS.Invalid);
                    self.error(`AmqpOut() Could not connect to broker ${e}`);
                }
                else {
                    self.status(constants_1.NODE_STATUS.Error);
                    self.error(`AmqpOut() ${e}`);
                }
            }
        })(this);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    RED.nodes.registerType(types_1.NodeType.AmqpOut, AmqpOut);
};
//# sourceMappingURL=amqp-out.js.map