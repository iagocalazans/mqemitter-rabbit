# MQEmitter RabbitMQ at AMQP protocol

An Opinionated Message Queue with an emitter-style API, but with callbacks.


**THIS IS NOT AN OFFICIAL MODULE FROM [@mcollina](https://github.com/mcollina).**


If you need a multi process MQEmitter, check out the table below:

- [mqemitter](https://github.com/mcollina/mqemitter): Standard MQemitter
- [mqemitter-redis](https://github.com/mcollina/mqemitter-redis): Redis-powered mqemitter
- [mqemitter-mongodb](https://github.com/mcollina/mqemitter-mongodb): Mongodb based mqemitter
- [mqemitter-child-process](https://github.com/mcollina/mqemitter-child-process): Share the same mqemitter between a hierarchy of child processes
- [mqemitter-cs](https://github.com/mcollina/mqemitter-cs): Expose a MQEmitter via a simple client/server protocol
- [mqemitter-p2p](https://github.com/mcollina/mqemitter-p2p): A P2P implementation of MQEmitter, based on HyperEmitter and a Merkle DAG
- [mqemitter-aerospike](https://github.com/mcollina/mqemitter-aerospike): Aerospike mqemitter

## Installation

```sh
npm install mqemitter-rabbit
```

## Examples

```ts
import { MessageFactory, MQEmitterAMQPLib } from 'mqemitter-rabbit';

const mqemitter = new MQEmitterAMQPLib({
  separator: ':'
});


mqemitter.startConnection(
  {
    url: 'amqps://username:password@hosname/db', // URL of your AMQP instance
    queues: ['entry:message', 'process:message', 'close:message'], // The queues to attach to
    method: ApplicationType.BOTH // Your connection method, must be one of: listener, publisher or both.
  }, 
  (err, cb) => {
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

        cb.release(message)
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
      message, // The message itself
      'entry:message', // Queue to publish/emit message
      undefined, // Some headers to attach to Message
      (err) => { // Err callback
        console.log(err); // You can retrieve the errors while trying to attach.
      }
    );
  }
);
```

## new MQEmitterAMQPLib ([options])

- options `<object>`
  - `concurrency` `<number>` maximum number of concurrent messages that can be on concurrent delivery. __Default__: `0`
  - `wildcardOne` `<string>` a char to use for matching exactly one _non-empty_ level word. __Default__: `+`
  - `wildcardSome` `<string>` a char to use for matching multiple level wildcards. __Default__: #`
  - `matchEmptyLevels` `<boolean>` If true then `wildcardOne` also matches an empty word. __Default__: `true`
  - `separator` `<string>`  a separator character to use for separating words. __Default__: `/`

Create a new MQEmitterAMQPLib class.

MQEmitterAMQPLib is the class and function exposed by this module.
It can be created by using `new MQEmitterAMQPLib({options})`.

For more information on wildcards, see [this explanation](#wildcards) or [Qlobber](https://www.npmjs.com/qlobber).

## emitter.emit (message, callback)

- `message` `<object>`
- `callback` `<Function>` `(error) => void`
  - error `<Error>` | `null`

Emit the given message, which must have a `topic` property, which can contain wildcards as defined on creation.

## emitter.on (topic, listener, [callback])

- `topic` `<string>`
- `listener` `<Function>` `(message, done) => void`
- `callback` `<Function>` `() => void`

Add the given listener to the passed topic. Topic can contain wildcards, as defined on creation.

The `listener` __must never error__ and `done` must not be called with an __`err`__ object.

`callback` will be called when the event subscribe is done correctly.

## emitter.removeListener (topic, listener, [callback])

The inverse of `on`.

## emitter.close (callback)

- `callback` `<Function>` `() => void`

Close the given emitter. After, all writes will return an error.

## Wildcards

__MQEmitter__ supports the use of wildcards: every topic is splitted according to `separator`.

The wildcard character `+` matches exactly _non-empty_ one word:

```js
emitter.on('hello/+/world', function(message, cb) {
  // will ONLY capture { topic: 'hello/my/world', 'something': 'more' }
  console.log(message)
  cb()
})
emitter.on('hello/+', function(message, cb) {
  // will not be called
  console.log(message)
  cb()
})

const messageComplete = new MessageFactory().generate(
        'hello/my/world', { something: 'more' }
      );
      const messageIncomplete = new MessageFactory().generate(
        'hello//world', { something: 'more' }
      );
emitter.emit(messageComplete)
emitter.emit(messageIncomplete)
```

The wildcard character `+` matches one word:

```js
emitter.on('hello/+/world', function(message, cb) {
  // will capture { topic: 'hello/my/world', 'something': 'more' }
  // and capture { topic: 'hello//world', 'something': 'more' }
  console.log(message)
  cb()
})

emitter.on('hello/+', function(message, cb) {
  // will not be called
  console.log(message)
  cb()
})

const messageComplete = new MessageFactory().generate(
        'hello/my/world', { something: 'more' }
      );
      const messageIncomplete = new MessageFactory().generate(
        'hello//world', { something: 'more' }
      );
emitter.emit(messageComplete)
emitter.emit(messageIncomplete)
```

The wildcard character `#` matches zero or more words:

```js
emitter.on('hello/#', function(message, cb) {
  // this will print { topic: 'hello/my/world', 'something': 'more' }
  console.log(message)
  cb()
})

emitter.on('#', function(message, cb) {
  // this will print { topic: 'hello/my/world', 'something': 'more' }
  console.log(message)
  cb()
})

emitter.on('hello/my/world/#', function(message, cb) {
  // this will print { topic: 'hello/my/world', 'something': 'more' }
  console.log(message)
  cb()
})

const message = new MessageFactory().generate(
        'hello/my/world', { something: 'more' }
      );
emitter.emit(message)
```

Of course, you can mix `#` and `+` in the same subscription.

## LICENSE

[ISC](https://github.com/iagocalazans/mqemitter-rabbit/blob/master/LICENSE)