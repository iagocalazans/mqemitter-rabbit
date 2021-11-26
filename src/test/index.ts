import { MQEmitterAMQPLib } from '../mqemitter-rabbit';

const mqemitter = new MQEmitterAMQPLib({
  separator: ':'
});
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

mqemitter.on(
  'conversation:message', (
    msg, done
  ) => {
    console.log(
      'Conversation received a new message', msg, done
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

      mqemitter.emit(
        {
          topic: 'conversation:message'
        }, 'process:message'
      );

      mqemitter.emit(
        {
          topic: 'conversation:postback'
        }, 'close:messagea'
      );
    } catch (err) {
      console.log(err);
    }
  }, 5000
);
