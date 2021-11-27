import { MessageFactory } from '../factory/factory.class';
import { MQEmitterAMQPLib } from '../mqemitter-rabbit';

const mqemitter = new MQEmitterAMQPLib({
  separator: ':'
});

mqemitter.startConnection(
  'amqps://username:password@domain/db', // URL of your AMQP instance
  ['entry:message', 'process:message', 'close:message'], // The queues to attach to
  'listener' // Your connection method, must be one of: listener, publisher or both.
);

mqemitter.events.on( // You can retrieve the errors on MQEmitter events.
  'error', (err) => console.log(err)
);

mqemitter.on(
  'conversation:created', (
    message, done
  ) => {
    console.log(
      'Creating new conversation', message
    );
    return done();
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
        message, 'entry:message', undefined,
        (err) => {
          console.log(err); // You can retrieve the errors while trying to attach.
        }
      );
    } catch (err) {
      console.log(err);
    }
  }, 5000
);
