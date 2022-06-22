import { NodeRedApp, EditorNodeProperties } from 'node-red'
import { NODE_STATUS } from '../constants'
import { ErrorType, NodeType, ManualAckType } from '../types'
import Amqp from '../Amqp'

module.exports = function (RED: NodeRedApp): void {
  function AmqpInManualAck(config: EditorNodeProperties & {
      exchangeRoutingKey: string
      exchangeRoutingKeyType: string
      exchangeName: string,
      exchangeNameKeyType: string

      amqpProperties: string
    }): void {
    let reconnectTimeout: NodeJS.Timeout
    RED.events.once('flows:stopped', () => {
      clearTimeout(reconnectTimeout)
    })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    RED.nodes.createNode(this, config)
    this.status(NODE_STATUS.Disconnected)
    const amqp = new Amqp(RED, this, config)

    ;(async function initializeNode(self): Promise<void> {
      const reconnect = () =>
        new Promise<void>(resolve => {
          reconnectTimeout = setTimeout(async () => {
            try {
              await initializeNode(self)
              resolve()
            } catch (e) {
              await reconnect()
            }
          }, 10000)
        })
      let node = this;
      try {
        const connection = await amqp.connect()

        // istanbul ignore else
        if (connection) {
          await amqp.initialize()
          await amqp.consume()

          self.on('input', async (msg, send, done) => {
            const { payload, routingKey, properties: msgProperties } = msg;
            const {
              exchangeRoutingKey,
              exchangeRoutingKeyType,
              exchangeName,
              exchangeNameKeyType,
              amqpProperties,
            } = config;

            switch (exchangeRoutingKeyType) {
              case 'env': {
                amqp.setRoutingKey(process.env[config.exchangeRoutingKey]);
                break;
              }
              case 'msg':
              case 'flow':
              case 'global':
                amqp.setRoutingKey(
                  RED.util.evaluateNodeProperty(
                    exchangeRoutingKey,
                    exchangeRoutingKeyType,
                    self,
                    msg,
                  ),
                )
                break
              case 'jsonata':
                amqp.setRoutingKey(
                  RED.util.evaluateJSONataExpression(
                    RED.util.prepareJSONataExpression(exchangeRoutingKey, self),
                    msg,
                  ),
                )
                break
              case 'str':
              default:
                if (routingKey) {
                  // if incoming payload contains a routingKey value
                  // override our string value with it.

                  // Superfluous (and possibly confusing) at this point
                  // but keeping it to retain backwards compatibility
                  amqp.setRoutingKey(routingKey)
                }
                break
            }

            switch (exchangeNameKeyType) {
              case 'env': {
                amqp.setExchangeName(process.env[config.exchangeName]);
                break;
              }
              case 'msg':
              case 'flow':
              case 'global':
                amqp.setExchangeName(
                  RED.util.evaluateNodeProperty(
                    exchangeName,
                    exchangeNameKeyType,
                    self,
                    msg,
                  ),
                )
                break
             
              case 'str':
              default:
                if (exchangeName) {
                  // if incoming payload contains a routingKey value
                  // override our string value with it.

                  // Superfluous (and possibly confusing) at this point
                  // but keeping it to retain backwards compatibility
                  amqp.setExchangeName(exchangeName)
                }
                break
            }


            if (msg.manualAck) {
              const ackMode = msg.manualAck.ackMode

              switch (ackMode) {
                case ManualAckType.AckAll:
                  amqp.ackAll()
                  break
                case ManualAckType.Nack:
                  amqp.nack(msg)
                  break
                case ManualAckType.NackAll:
                  amqp.nackAll(msg)
                  break
                case ManualAckType.Reject:
                  amqp.reject(msg)
                  break
                case ManualAckType.Ack:
                default:
                  amqp.ack(msg)
                  break
              }
            } else {
              amqp.ack(msg)
            }

            /* istanbul ignore else */
            done && done()
          })

          // When the server goes down
          self.once('close', async (done: () => void): Promise<void> => {
            await amqp.close()
            done && done()
          })

          // When the server goes down
          connection.on('close', async e => {
            e && (await reconnect())
          })

          self.status(NODE_STATUS.Connected)
        }
      } catch (e) {
        console.error("Error",e);
        node.error(e);
        if (e.code === ErrorType.ConnectionRefused || e.isOperational) {
          await reconnect()
        } else if (e.code === ErrorType.InvalidLogin) {
          self.status(NODE_STATUS.Invalid)
          self.error(`AmqpInManualAck() Could not connect to broker ${e}`)
        } else {
          self.status(NODE_STATUS.Error)
          self.error(`AmqpInManualAck() ${e}`)
        }
      }
    })(this)
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  RED.nodes.registerType(NodeType.AmqpInManualAck, AmqpInManualAck)
}
