"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = exports.brokerConfigFixture = exports.nodeFixture = exports.nodeConfigFixture = exports.credentialsFixture = exports.amqpOutFlowFixture = exports.amqpInManualAckFlowFixture = exports.amqpInFlowFixture = void 0;
const types_1 = require("../src/types");
exports.amqpInFlowFixture = [
    {
        id: 'n1',
        type: types_1.NodeType.AmqpIn,
        wires: [['n2']],
        name: '',
        broker: 'n3',
        noAck: true,
        exchangeName: 'testtopic',
        exchangeType: 'topic',
        routingKey: '#',
        durable: true,
        queueName: '',
        exclusive: true,
    },
    { id: 'n2', type: 'helper' },
    {
        id: 'n3',
        type: 'amqp-broker',
        z: '',
        host: 'localhost',
        port: '5672',
    },
];
exports.amqpInManualAckFlowFixture = [
    {
        id: 'n1',
        type: types_1.NodeType.AmqpInManualAck,
        wires: [['n2']],
        name: '',
        broker: 'n3',
        noAck: true,
        exchangeName: 'testtopic',
        exchangeType: 'topic',
        routingKey: '#',
        durable: true,
        queueName: '',
        exclusive: true,
    },
    { id: 'n2', type: 'helper' },
    {
        id: 'n3',
        type: 'amqp-broker',
        z: '',
        host: 'localhost',
        port: '5672',
    },
];
exports.amqpOutFlowFixture = [
    {
        id: 'n1',
        type: types_1.NodeType.AmqpOut,
        wires: [['n2']],
        name: '',
        broker: 'n3',
        noAck: true,
        exchangeName: 'testtopic',
        exchangeType: 'topic',
        exchangeRoutingKey: 'test.message.topic',
        exchangeRoutingKeyType: 'str',
        durable: true,
        queueName: '',
        exclusive: true,
    },
    { id: 'n2', type: 'helper' },
    {
        id: 'n3',
        type: 'amqp-broker',
        z: '',
        host: 'localhost',
        port: '5672',
    },
];
exports.credentialsFixture = { username: 'username', password: 'password' };
exports.nodeConfigFixture = {
    name: 'name',
    broker: 'b1',
    exchangeName: 'exchangeName',
    exchangeType: types_1.ExchangeType.Topic,
    noAck: false,
    exchangeRoutingKey: 'routing.key',
    exchangeDurable: true,
    queueName: '',
    queueExclusive: true,
    queueDurable: false,
    queueAutoDelete: true,
};
exports.nodeFixture = {
    status: () => null,
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.brokerConfigFixture = {
    host: 'host',
    port: 222,
    credentials: {
        username: 'username',
        password: 'password',
    },
};
class CustomError extends Error {
    constructor(code, ...params) {
        super(...params);
        this.code = code;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }
        this.name = 'CustomError';
    }
}
exports.CustomError = CustomError;
//# sourceMappingURL=doubles.js.map