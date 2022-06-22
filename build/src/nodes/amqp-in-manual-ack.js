"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const types_1 = require("../types");
const Amqp_1 = require("../Amqp");
module.exports = function (RED) {
    function AmqpInManualAck(config) {
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
                }, 10000);
            });
            let node = this;
            try {
                const connection = await amqp.connect();
                // istanbul ignore else
                if (connection) {
                    await amqp.initialize();
                    await amqp.consume();
                    self.on('input', async (msg, send, done) => {
                        const { payload, routingKey, properties: msgProperties } = msg;
                        const { exchangeRoutingKey, exchangeRoutingKeyType, exchangeName, exchangeNameKeyType, amqpProperties, } = config;
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
                        if (msg.manualAck) {
                            const ackMode = msg.manualAck.ackMode;
                            switch (ackMode) {
                                case types_1.ManualAckType.AckAll:
                                    amqp.ackAll();
                                    break;
                                case types_1.ManualAckType.Nack:
                                    amqp.nack(msg);
                                    break;
                                case types_1.ManualAckType.NackAll:
                                    amqp.nackAll(msg);
                                    break;
                                case types_1.ManualAckType.Reject:
                                    amqp.reject(msg);
                                    break;
                                case types_1.ManualAckType.Ack:
                                default:
                                    amqp.ack(msg);
                                    break;
                            }
                        }
                        else {
                            amqp.ack(msg);
                        }
                        /* istanbul ignore else */
                        done && done();
                    });
                    // When the server goes down
                    self.once('close', async (done) => {
                        await amqp.close();
                        done && done();
                    });
                    // When the server goes down
                    connection.on('close', async (e) => {
                        e && (await reconnect());
                    });
                    self.status(constants_1.NODE_STATUS.Connected);
                }
            }
            catch (e) {
                console.error("Error", e);
                node.error(e);
                if (e.code === types_1.ErrorType.ConnectionRefused || e.isOperational) {
                    await reconnect();
                }
                else if (e.code === types_1.ErrorType.InvalidLogin) {
                    self.status(constants_1.NODE_STATUS.Invalid);
                    self.error(`AmqpInManualAck() Could not connect to broker ${e}`);
                }
                else {
                    self.status(constants_1.NODE_STATUS.Error);
                    self.error(`AmqpInManualAck() ${e}`);
                }
            }
        })(this);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    RED.nodes.registerType(types_1.NodeType.AmqpInManualAck, AmqpInManualAck);
};
//# sourceMappingURL=amqp-in-manual-ack.js.map