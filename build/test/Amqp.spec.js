"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
const chai_1 = require("chai");
const sinon = require("sinon");
const amqplib = require("amqplib");
const Amqp_1 = require("../src/Amqp");
const doubles_1 = require("./doubles");
const types_1 = require("../src/types");
let RED;
let amqp;
describe('Amqp Class', () => {
    beforeEach(function (done) {
        RED = {
            nodes: {
                getNode: sinon.stub().returns(doubles_1.brokerConfigFixture),
            },
        };
        // @ts-ignore
        amqp = new Amqp_1.default(RED, doubles_1.nodeFixture, doubles_1.nodeConfigFixture);
        done();
    });
    afterEach(function (done) {
        sinon.restore();
        done();
    });
    it('constructs with default Direct exchange', () => {
        // @ts-ignore
        amqp = new Amqp_1.default(RED, doubles_1.nodeFixture, Object.assign(Object.assign({}, doubles_1.nodeConfigFixture), { exchangeType: types_1.ExchangeType.Direct, exchangeName: types_1.DefaultExchangeName.Direct }));
        chai_1.expect(amqp.config.exchange.name).to.eq(types_1.DefaultExchangeName.Direct);
    });
    it('constructs with default Fanout exchange', () => {
        // @ts-ignore
        amqp = new Amqp_1.default(RED, doubles_1.nodeFixture, Object.assign(Object.assign({}, doubles_1.nodeConfigFixture), { exchangeType: types_1.ExchangeType.Fanout, exchangeName: types_1.DefaultExchangeName.Fanout }));
        chai_1.expect(amqp.config.exchange.name).to.eq(types_1.DefaultExchangeName.Fanout);
    });
    it('constructs with default Topic exchange', () => {
        // @ts-ignore
        amqp = new Amqp_1.default(RED, doubles_1.nodeFixture, Object.assign(Object.assign({}, doubles_1.nodeConfigFixture), { exchangeType: types_1.ExchangeType.Topic, exchangeName: types_1.DefaultExchangeName.Topic }));
        chai_1.expect(amqp.config.exchange.name).to.eq(types_1.DefaultExchangeName.Topic);
    });
    it('constructs with default Headers exchange', () => {
        // @ts-ignore
        amqp = new Amqp_1.default(RED, doubles_1.nodeFixture, Object.assign(Object.assign({}, doubles_1.nodeConfigFixture), { exchangeType: types_1.ExchangeType.Headers, exchangeName: types_1.DefaultExchangeName.Headers }));
        chai_1.expect(amqp.config.exchange.name).to.eq(types_1.DefaultExchangeName.Headers);
    });
    it('connect()', async () => {
        const error = 'error!';
        const result = { on: () => error };
        // @ts-ignore
        sinon.stub(amqplib, 'connect').resolves(result);
        const connection = await amqp.connect();
        chai_1.expect(connection).to.eq(result);
    });
    it('initialize()', async () => {
        const createChannelStub = sinon.stub();
        const assertExchangeStub = sinon.stub();
        amqp.createChannel = createChannelStub;
        amqp.assertExchange = assertExchangeStub;
        await amqp.initialize();
        chai_1.expect(createChannelStub.calledOnce).to.equal(true);
        chai_1.expect(assertExchangeStub.calledOnce).to.equal(true);
    });
    it('consume()', async () => {
        const assertQueueStub = sinon.stub();
        const bindQueueStub = sinon.stub();
        const messageContent = 'messageContent';
        const send = sinon.stub();
        const error = sinon.stub();
        const node = { send, error };
        const channel = {
            consume: function (queue, cb, 
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            config) {
                const amqpMessage = { content: messageContent };
                cb(amqpMessage);
            },
        };
        amqp.channel = channel;
        amqp.assertQueue = assertQueueStub;
        amqp.bindQueue = bindQueueStub;
        amqp.q = { queue: 'queueName' };
        amqp.node = node;
        await amqp.consume();
        chai_1.expect(assertQueueStub.calledOnce).to.equal(true);
        chai_1.expect(bindQueueStub.calledOnce).to.equal(true);
        chai_1.expect(send.calledOnce).to.equal(true);
        chai_1.expect(send.calledWith({
            content: messageContent,
            payload: messageContent,
        })).to.equal(true);
    });
    describe('publish()', () => {
        it('publishes a message (topic)', () => {
            const publishStub = sinon.stub();
            amqp.channel = {
                publish: publishStub,
            };
            amqp.publish('a message');
            chai_1.expect(publishStub.calledOnce).to.equal(true);
        });
        it('publishes a message (fanout)', () => {
            // @ts-ignore
            amqp = new Amqp_1.default(RED, doubles_1.nodeFixture, Object.assign(Object.assign({}, doubles_1.nodeConfigFixture), { exchangeType: types_1.ExchangeType.Fanout }));
            const publishStub = sinon.stub();
            amqp.channel = {
                publish: publishStub,
            };
            amqp.publish('a message');
            chai_1.expect(publishStub.calledOnce).to.equal(true);
        });
        it('publishes a message (direct w/RPC)', () => {
            // @ts-ignore
            amqp = new Amqp_1.default(RED, doubles_1.nodeFixture, Object.assign(Object.assign({}, doubles_1.nodeConfigFixture), { exchangeType: types_1.ExchangeType.Direct, outputs: 1 }));
            const publishStub = sinon.stub();
            const assertQueueStub = sinon.stub();
            const consumeStub = sinon.stub();
            amqp.channel = {
                publish: publishStub,
                assertQueue: assertQueueStub,
                consume: consumeStub,
            };
            const routingKey = 'rpc-routingkey';
            amqp.config = {
                broker: '',
                exchange: { type: types_1.ExchangeType.Direct, routingKey },
                queue: {},
                amqpProperties: {},
                outputs: 1,
            };
            amqp.node = {
                error: sinon.stub(),
            };
            amqp.q = {};
            amqp.publish('a message');
            // FIXME: we're losing `this` in here and can't assert on mocks.
            // So no assertions :(
            // expect(consumeStub.calledOnce).to.equal(true)
            // expect(publishStub.calledOnce).to.equal(true)
        });
        it('tries to publish an invalid message', async () => {
            const publishStub = sinon.stub().throws();
            const errorStub = sinon.stub();
            amqp.channel = {
                publish: publishStub,
            };
            amqp.node = {
                error: errorStub,
            };
            await amqp.publish('a message');
            chai_1.expect(publishStub.calledOnce).to.equal(true);
            chai_1.expect(errorStub.calledOnce).to.equal(true);
        });
    });
    it('close()', async () => {
        const { exchangeName, exchangeRoutingKey } = doubles_1.nodeConfigFixture;
        const queueName = 'queueName';
        const unbindQueueStub = sinon.stub();
        const channelCloseStub = sinon.stub();
        const connectionCloseStub = sinon.stub();
        const assertQueueStub = sinon.stub().resolves({ queue: queueName });
        amqp.channel = {
            unbindQueue: unbindQueueStub,
            close: channelCloseStub,
            assertQueue: assertQueueStub,
        };
        amqp.connection = { close: connectionCloseStub };
        await amqp.assertQueue();
        await amqp.close();
        chai_1.expect(unbindQueueStub.calledOnce).to.equal(true);
        chai_1.expect(unbindQueueStub.calledWith(queueName, exchangeName, exchangeRoutingKey)).to.equal(true);
        chai_1.expect(channelCloseStub.calledOnce).to.equal(true);
        chai_1.expect(connectionCloseStub.calledOnce).to.equal(true);
    });
    it('createChannel()', async () => {
        const error = 'error!';
        const result = {
            on: () => error,
            prefetch: () => null,
        };
        const createChannelStub = sinon.stub().returns(result);
        amqp.connection = { createChannel: createChannelStub };
        await amqp.createChannel();
        chai_1.expect(createChannelStub.calledOnce).to.equal(true);
        chai_1.expect(amqp.channel).to.eq(result);
    });
    it('assertExchange()', async () => {
        const assertExchangeStub = sinon.stub();
        amqp.channel = { assertExchange: assertExchangeStub };
        const { exchangeName, exchangeType, exchangeDurable } = doubles_1.nodeConfigFixture;
        await amqp.assertExchange();
        chai_1.expect(assertExchangeStub.calledOnce).to.equal(true);
        chai_1.expect(assertExchangeStub.calledWith(exchangeName, exchangeType, {
            durable: exchangeDurable,
        })).to.equal(true);
    });
    it('assertQueue()', async () => {
        const queue = 'queueName';
        const { queueName, queueExclusive, queueDurable, queueAutoDelete } = doubles_1.nodeConfigFixture;
        const assertQueueStub = sinon.stub().resolves({ queue });
        amqp.channel = { assertQueue: assertQueueStub };
        await amqp.assertQueue();
        chai_1.expect(assertQueueStub.calledOnce).to.equal(true);
        chai_1.expect(assertQueueStub.calledWith(queueName, {
            exclusive: queueExclusive,
            durable: queueDurable,
            autoDelete: queueAutoDelete,
        })).to.equal(true);
    });
    it('bindQueue() topic exchange', () => {
        const queue = 'queueName';
        const bindQueueStub = sinon.stub();
        amqp.channel = { bindQueue: bindQueueStub };
        amqp.q = { queue };
        const { exchangeName, exchangeRoutingKey } = doubles_1.nodeConfigFixture;
        amqp.bindQueue();
        chai_1.expect(bindQueueStub.calledOnce).to.equal(true);
        chai_1.expect(bindQueueStub.calledWith(queue, exchangeName, exchangeRoutingKey)).to.equal(true);
    });
    it('bindQueue() direct exchange', () => {
        const config = Object.assign(Object.assign({}, doubles_1.nodeConfigFixture), { exchangeType: types_1.ExchangeType.Direct, exchangeRoutingKey: 'routing-key' });
        // @ts-ignore
        amqp = new Amqp_1.default(RED, doubles_1.nodeFixture, config);
        const queue = 'queueName';
        const bindQueueStub = sinon.stub();
        amqp.channel = { bindQueue: bindQueueStub };
        amqp.q = { queue };
        const { exchangeName, exchangeRoutingKey } = config;
        amqp.bindQueue();
        // expect(bindQueueStub.calledOnce).to.equal(true)
        chai_1.expect(bindQueueStub.calledWith(queue, exchangeName, exchangeRoutingKey)).to.equal(true);
    });
    it('bindQueue() fanout exchange', () => {
        const config = Object.assign(Object.assign({}, doubles_1.nodeConfigFixture), { exchangeType: types_1.ExchangeType.Fanout, exchangeRoutingKey: '' });
        // @ts-ignore
        amqp = new Amqp_1.default(RED, doubles_1.nodeFixture, config);
        const queue = 'queueName';
        const bindQueueStub = sinon.stub();
        amqp.channel = { bindQueue: bindQueueStub };
        amqp.q = { queue };
        const { exchangeName } = config;
        amqp.bindQueue();
        chai_1.expect(bindQueueStub.calledOnce).to.equal(true);
        chai_1.expect(bindQueueStub.calledWith(queue, exchangeName, '')).to.equal(true);
    });
    it('bindQueue() headers exchange', () => {
        const config = Object.assign(Object.assign({}, doubles_1.nodeConfigFixture), { exchangeType: types_1.ExchangeType.Headers, exchangeRoutingKey: '', headers: { some: 'headers' } });
        // @ts-ignore
        amqp = new Amqp_1.default(RED, doubles_1.nodeFixture, config);
        const queue = 'queueName';
        const bindQueueStub = sinon.stub();
        amqp.channel = { bindQueue: bindQueueStub };
        amqp.q = { queue };
        const { exchangeName, headers } = config;
        amqp.bindQueue();
        chai_1.expect(bindQueueStub.calledOnce).to.equal(true);
        chai_1.expect(bindQueueStub.calledWith(queue, exchangeName, '', headers)).to.equal(true);
    });
});
//# sourceMappingURL=Amqp.spec.js.map