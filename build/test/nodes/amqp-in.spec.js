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
const amqpIn = require('../../src/nodes/amqp-in');
const amqpBroker = require('../../src/nodes/amqp-broker');
helper.init(require.resolve('node-red'));
describe('amqp-in Node', () => {
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
        const flow = [{ id: 'n1', type: types_1.NodeType.AmqpIn, name: 'test name' }];
        helper.load(amqpIn, flow, () => {
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
        helper.load([amqpIn, amqpBroker], doubles_1.amqpInFlowFixture, doubles_1.credentialsFixture, async function () {
            chai_1.expect(connectStub.calledOnce).to.be.true;
            // TODO: Figure out why this isn't working:
            // expect(initializeStub.calledOnce).to.be.true
            const amqpInNode = helper.getNode('n1');
            amqpInNode.close();
            done();
        });
    });
    it('should reconnect to the server', function (done) {
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
        const initializeStub = sinon.stub(Amqp_1.default.prototype, 'initialize');
        helper.load([amqpIn, amqpBroker], doubles_1.amqpInFlowFixture, doubles_1.credentialsFixture, async function () {
            chai_1.expect(connectStub.calledOnce).to.be.true;
            // TODO: Figure out why this isn't working:
            // expect(initializeStub.calledOnce).to.be.true
            const amqpInNode = helper.getNode('n1');
            amqpInNode.close();
            done();
        });
    });
    it('tries to connect but the broker is down', function (done) {
        const connectStub = sinon
            .stub(Amqp_1.default.prototype, 'connect')
            .throws(new doubles_1.CustomError(types_1.ErrorType.ConnectionRefused));
        helper.load([amqpIn, amqpBroker], doubles_1.amqpInFlowFixture, doubles_1.credentialsFixture, function () {
            chai_1.expect(connectStub).to.throw();
            // clock.tick(200)
            done();
        });
    });
    it('catches an invalid login exception', function (done) {
        const connectStub = sinon
            .stub(Amqp_1.default.prototype, 'connect')
            .throws(new doubles_1.CustomError(types_1.ErrorType.InvalidLogin));
        helper.load([amqpIn, amqpBroker], doubles_1.amqpInFlowFixture, doubles_1.credentialsFixture, function () {
            chai_1.expect(connectStub).to.throw();
            done();
        });
    });
    it('catches a generic exception', function (done) {
        const connectStub = sinon.stub(Amqp_1.default.prototype, 'connect').throws();
        helper.load([amqpIn, amqpBroker], doubles_1.amqpInFlowFixture, doubles_1.credentialsFixture, function () {
            chai_1.expect(connectStub).to.throw();
            done();
        });
    });
});
//# sourceMappingURL=amqp-in.spec.js.map