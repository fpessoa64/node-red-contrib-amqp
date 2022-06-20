"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/ban-ts-comment */
const chai_1 = require("chai");
const sinon = require("sinon");
const Amqp_1 = require("../../src/Amqp");
const types_1 = require("../../src/types");
const doubles_1 = require("../doubles");
const helper = require('node-red-node-test-helper');
const amqpOut = require('../../src/nodes/amqp-out');
const amqpBroker = require('../../src/nodes/amqp-broker');
helper.init(require.resolve('node-red'));
describe('amqp-out Node', () => {
    beforeEach(function (done) {
        helper.startServer(done);
    });
    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
        sinon.restore();
    });
    it('should be loaded', done => {
        sinon.stub(Amqp_1.default.prototype, 'connect');
        const flow = [{ id: 'n1', type: types_1.NodeType.AmqpOut, name: 'test name' }];
        helper.load(amqpOut, flow, () => {
            const n1 = helper.getNode('n1');
            n1.should.have.property('name', 'test name');
            done();
        });
    });
    it('should connect to the server and send some messages', function (done) {
        // @ts-ignore
        Amqp_1.default.prototype.channel = {
            unbindQueue: () => null,
            close: () => null,
        };
        // @ts-ignore
        Amqp_1.default.prototype.connection = {
            close: () => null,
        };
        const connectStub = sinon
            .stub(Amqp_1.default.prototype, 'connect')
            // @ts-ignore
            .resolves(true);
        sinon.stub(Amqp_1.default.prototype, 'initialize');
        helper.load([amqpOut, amqpBroker], doubles_1.amqpOutFlowFixture, doubles_1.credentialsFixture, async function () {
            chai_1.expect(connectStub.calledOnce).to.be.true;
            // TODO: Figure out why this isn't working:
            // expect(initializeStub.calledOnce).to.be.true
            const amqpOutNode = helper.getNode('n1');
            amqpOutNode.receive({ payload: 'foo', routingKey: 'bar' });
            amqpOutNode.receive({ payload: 'foo' });
            amqpOutNode.close();
            done();
        });
    });
    it('should connect to the server and send some messages with a dynamic routing key from `msg`', function (done) {
        // @ts-ignore
        Amqp_1.default.prototype.channel = {
            unbindQueue: () => null,
            close: () => null,
        };
        // @ts-ignore
        Amqp_1.default.prototype.connection = {
            close: () => null,
        };
        const connectStub = sinon
            .stub(Amqp_1.default.prototype, 'connect')
            // @ts-ignore
            .resolves(true);
        sinon.stub(Amqp_1.default.prototype, 'initialize');
        const flowFixture = [...doubles_1.amqpOutFlowFixture];
        // @ts-ignore
        flowFixture[0].exchangeRoutingKeyType = 'msg';
        helper.load([amqpOut, amqpBroker], flowFixture, doubles_1.credentialsFixture, async function () {
            chai_1.expect(connectStub.calledOnce).to.be.true;
            // TODO: Figure out why this isn't working:
            // expect(initializeStub.calledOnce).to.be.true
            const amqpOutNode = helper.getNode('n1');
            amqpOutNode.receive({ payload: 'foo' });
            amqpOutNode.close();
            done();
        });
    });
    it('should connect to the server and send some messages with a dynamic jsonata routing key', function (done) {
        // @ts-ignore
        Amqp_1.default.prototype.channel = {
            unbindQueue: () => null,
            close: () => null,
        };
        // @ts-ignore
        Amqp_1.default.prototype.connection = {
            close: () => null,
        };
        const connectStub = sinon
            .stub(Amqp_1.default.prototype, 'connect')
            // @ts-ignore
            .resolves(true);
        sinon.stub(Amqp_1.default.prototype, 'initialize');
        const flowFixture = [...doubles_1.amqpOutFlowFixture];
        // @ts-ignore
        flowFixture[0].exchangeRoutingKeyType = 'jsonata';
        helper.load([amqpOut, amqpBroker], flowFixture, doubles_1.credentialsFixture, async function () {
            chai_1.expect(connectStub.calledOnce).to.be.true;
            // TODO: Figure out why this isn't working:
            // expect(initializeStub.calledOnce).to.be.true
            const amqpOutNode = helper.getNode('n1');
            amqpOutNode.receive({ payload: 'foo' });
            amqpOutNode.close();
            done();
        });
    });
    it('tries to connect but the broker is down', function (done) {
        const connectStub = sinon
            .stub(Amqp_1.default.prototype, 'connect')
            .throws(new doubles_1.CustomError(types_1.ErrorType.ConnectionRefused));
        helper.load([amqpOut, amqpBroker], doubles_1.amqpOutFlowFixture, doubles_1.credentialsFixture, function () {
            chai_1.expect(connectStub).to.throw();
            done();
        });
    });
    it('catches an invalid login exception', function (done) {
        const connectStub = sinon
            .stub(Amqp_1.default.prototype, 'connect')
            .throws(new doubles_1.CustomError(types_1.ErrorType.InvalidLogin));
        helper.load([amqpOut, amqpBroker], doubles_1.amqpOutFlowFixture, doubles_1.credentialsFixture, function () {
            chai_1.expect(connectStub).to.throw();
            done();
        });
    });
    it('catches a generic exception', function (done) {
        const connectStub = sinon.stub(Amqp_1.default.prototype, 'connect').throws();
        helper.load([amqpOut, amqpBroker], doubles_1.amqpOutFlowFixture, doubles_1.credentialsFixture, function () {
            chai_1.expect(connectStub).to.throw();
            done();
        });
    });
});
//# sourceMappingURL=amqp-out.spec.js.map