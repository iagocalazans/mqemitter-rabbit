import { MQEmitterAMQPLib } from '../mqemitter-rabbit';

const mqemitter = new MQEmitterAMQPLib({
  separator: ':'
});
mqemitter.startConnection(
  'amqps://stzzvlat:HdMY4CshCcwX0P2xsngXUU4Z1xTLYJfx@fish.rmq.cloudamqp.com/stzzvlat', ['entry:message', 'process:message', 'close:message']
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

mqemitter.emit({
  topic: 'conversation:created'
});

mqemitter.emit({
  topic: 'conversation:message'
});

mqemitter.emit({
  topic: 'conversation:postback'
});
