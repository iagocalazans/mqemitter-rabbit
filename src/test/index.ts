import { MessageFactory } from '../factory/factory.class';
import { ApplicationType, MQEmitterAMQPLib } from '../mqemitter-rabbit';

const mqemitter = new MQEmitterAMQPLib({
  separator: ':'
});

mqemitter.startConnection(
  {
    url: 'amqps://username:password@hosname/db', // URL of your AMQP instance
    queues: ['entry:message', 'process:message', 'close:message'], // The queues to attach to
    method: ApplicationType.BOTH
  }, // Your connection method, must be one of: listener, publisher or both.
  (
    err, cb
  ) => {
    if (err !== undefined) {
      return err;
    }

    cb?.on(
      'conversation:created', (
        message, done
      ) => {
        console.log(
          'Creating new conversation', message
        );
        return done();
      }
    );

    const message = new MessageFactory().generate(
      'conversation:created', // Topic: Required.
      { // Content: aditional content can be attached to the Message.
        user: {
          name: 'Iago Calazans',
          age: 29
        }
      }
    );

    cb?.emit(
      message, 'entry:message', undefined,
      (err) => {
        console.log(err); // You can retrieve the errors while trying to attach.
      }
    );
  }
);

mqemitter.events.on( // You can retrieve the errors on MQEmitter events.
  'error', (err) => console.log(err)
);
