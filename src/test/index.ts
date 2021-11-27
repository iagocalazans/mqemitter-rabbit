import { MessageFactory } from '../factory/factory.class';
import { MQEmitterAMQPLib } from '../mqemitter-rabbit';

const mqemitter = new MQEmitterAMQPLib({
  separator: ':'
});

mqemitter.startConnection(
  'amqps://stzzvlat:HdMY4CshCcwX0P2xsngXUU4Z1xTLYJfx@fish.rmq.cloudamqp.com/stzzvlat', // URL of your AMQP instance
  ['entry:message', 'process:message', 'close:message'], // The queues to attach to
  'listener' // Your connection method, must be one of: listener, publisher or both
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

mqemitter.events.on(
  'error', (err) => console.log(err)
);

setTimeout(
  () => {
    try {
      const iago = new MessageFactory().generate(
        'conversation:created', // Topic: Required.
        { // Content: aditional content can be attached to the Message.
          user: {
            name: 'Iago Calazans',
            age: 29
          }
        }
      );

      const nath = new MessageFactory().generate(
        'conversation:created', // Topic: Required.
        { // Content: aditional content can be attached to the Message.
          user: {
            name: 'Nath Endlich',
            age: 26
          }
        }
      );

      mqemitter.emit(
        iago, 'entry:message'
      );

      mqemitter.emit(
        nath, 'entry:message'
      );
    } catch (err) {
      console.log(err);
    }
  }, 5000
);
