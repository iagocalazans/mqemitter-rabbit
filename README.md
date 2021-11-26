<!-- markdownlint-disable MD013 MD024 -->

# MQEmitter RabbitMQ at AMQP protocol

An Opinionated Message Queue with an emitter-style API, but with callbacks.


**THIS IS NOT AN OFFICIAL MODULE FROM [@mcollina](https://github.com/mcollina).**


If you need a multi process MQEmitter, check out the table below:

- [mqemitter-redis]: Redis-powered mqemitter
- [mqemitter]: Standard MQemitter
- [mqemitter-mongodb]: Mongodb based mqemitter
- [mqemitter-child-process]: Share the same mqemitter between a hierarchy of child processes
- [mqemitter-cs]: Expose a MQEmitter via a simple client/server protocol
- [mqemitter-p2p]: A P2P implementation of MQEmitter, based on HyperEmitter and a Merkle DAG
- [mqemitter-aerospike]: Aerospike mqemitter

## Installation

```sh
npm install mqemitter-rabbit
```

## Examples

```ts
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

```

## new MQEmitter ([options])

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

emitter.emit({ topic: 'hello/my/world', something: 'more' })
emitter.emit({ topic: 'hello//world', something: 'more' })
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

emitter.emit({ topic: 'hello/my/world', something: 'more' })
emitter.emit({ topic: 'hello//world', something: 'more' })
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

emitter.emit({ topic: 'hello/my/world', something: 'more' })
```

Of course, you can mix `#` and `+` in the same subscription.

## LICENSE

ISC