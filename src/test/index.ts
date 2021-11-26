import { MessageFactory } from '../factory/factory.class';
import { MQEmitterAMQPLib } from '../mqemitter-rabbit';

const mqemitter = new MQEmitterAMQPLib({
  separator: ':'
});

/**
 *
 * You must call startConnection to connect your RabbitMQ instance.
 *
 * @function startConnection
 * @param {string} url
 * @param {Array<string>} queues
 * @param {'listener'|'publisher'|'both'} type
 */
mqemitter.startConnection(
  'amqps://username:password@host/db', ['entry:message', 'process:message', 'close:message'], 'both'
);

mqemitter.on(
  'conversation:created', (
    message, done
  ) => {
    console.log(
      'Creating new conversation', message
    );
    done();
  }
);

setTimeout(
  () => {
    try {
      const message = new MessageFactory().generate(
        'conversation:created', // Topic: Required.
        { // Content: aditional content can be attached to the Message.
          user: {
            name: 'Iago Calazans',
            age: 29
          }
        }
      );

      mqemitter.emit(
        message, 'entry:message'
      );
    } catch (err) {
      console.log(err);
    }
  }, 5000
);
