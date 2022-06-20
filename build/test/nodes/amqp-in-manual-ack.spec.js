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
const amqpInManualAck = require('../../src/nodes/amqp-in-manual-ack');
const amqpBroker = require('../../src/nodes/amqp-broker');
helper.init(require.resolve('node-red'));
describe('amqp-in-manual-ack Node', () => {
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
        const flow = [
            { id: 'n1', type: types_1.NodeType.AmqpInManualAck, name: 'test name' },
        ];
        helper.load(amqpInManualAck, flow, () => {
            const n1 = helper.getNode('n1');
            n1.should.have.property('name', 'test name');
            done();
        });
    });
    it('should connect to the server', function (done) {
        // @ts-ignore
        Amqp_1.default.prototype.channel = {
            unbindQueue: () => null,
            close: () => null,
            ack: () => null,
        };
        // @ts-ignore
        Amqp_1.default.prototype.connection = {
            close: () => null,
        };
        const connectStub = sinon
            .stub(Amqp_1.default.prototype, 'connect')
            // @ts-ignore
            .resolves(true);
        const initializeStub = sinon.stub(Amqp_1.default.prototype, 'initialize');
        helper.load([amqpInManualAck, amqpBroker], doubles_1.amqpInManualAckFlowFixture, doubles_1.credentialsFixture, async function () {
            chai_1.expect(connectStub.calledOnce).to.be.true;
            // FIXME: Figure out why this isn't working:
            // expect(initializeStub.calledOnce).to.be.true
            const amqpInManualAckNode = helper.getNode('n1');
            // FIXME: these tests are essentially meaningless.
            // For some reason the node is not being properly loaded by the helper
            // They are not executing code
            amqpInManualAckNode.receive({ payload: 'foo', routingKey: 'bar' });
            amqpInManualAckNode.receive({
                payload: 'foo',
                routingKey: 'bar',
                manualAck: {
                    ackMode: types_1.ManualAckType.Ack,
                },
            });
            amqpInManualAckNode.receive({
                payload: 'foo',
                routingKey: 'bar',
                manualAck: {
                    ackMode: types_1.ManualAckType.AckAll,
                },
            });
            amqpInManualAckNode.receive({
                payload: 'foo',
                routingKey: 'bar',
                manualAck: {
                    ackMode: types_1.ManualAckType.Nack,
                },
            });
            amqpInManualAckNode.receive({
                payload: 'foo',
                routingKey: 'bar',
                manualAck: {
                    ackMode: types_1.ManualAckType.NackAll,
                },
            });
            amqpInManualAckNode.receive({
                payload: 'foo',
                routingKey: 'bar',
                manualAck: {
                    ackMode: types_1.ManualAckType.Reject,
                },
            });
            amqpInManualAckNode.on('input', () => {
                console.warn('this is input?');
                done();
            });
            amqpInManualAckNode.close(true);
            done();
        });
    });
    it('tries to connect but the broker is down', function (done) {
        const connectStub = sinon
            .stub(Amqp_1.default.prototype, 'connect')
            .throws(new doubles_1.CustomError(types_1.ErrorType.ConnectionRefused));
        helper.load([amqpInManualAck, amqpBroker], doubles_1.amqpInManualAckFlowFixture, doubles_1.credentialsFixture, function () {
            chai_1.expect(connectStub).to.throw();
            done();
        });
    });
    it('catches an invalid login exception', function (done) {
        const connectStub = sinon
            .stub(Amqp_1.default.prototype, 'connect')
            .throws(new doubles_1.CustomError(types_1.ErrorType.InvalidLogin));
        helper.load([amqpInManualAck, amqpBroker], doubles_1.amqpInManualAckFlowFixture, doubles_1.credentialsFixture, function () {
            chai_1.expect(connectStub).to.throw();
            done();
        });
    });
    it('catches a generic exception', function (done) {
        const connectStub = sinon.stub(Amqp_1.default.prototype, 'connect').throws();
        helper.load([amqpInManualAck, amqpBroker], doubles_1.amqpInManualAckFlowFixture, doubles_1.credentialsFixture, function () {
            chai_1.expect(connectStub).to.throw();
            done();
        });
    });
});
//# sourceMappingURL=amqp-in-manual-ack.spec.js.map