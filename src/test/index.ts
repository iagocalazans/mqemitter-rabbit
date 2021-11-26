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
  'amqps://your-url-must-come-here', ['entry:message', 'process:message', 'close:message'], 'both'
);

mqemitter.on(
  'conversation:created', (
    msg, done
  ) => {
    console.log(
      'Creating new conversation', msg, done
    );
  }
);

setTimeout(
  () => {
    try {
      mqemitter.emit(
        {
          topic: 'conversation:created'
        }, 'entry:message'
      );
    } catch (err) {
      console.log(err);
    }
  }, 5000
);
