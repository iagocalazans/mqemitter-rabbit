/* eslint-disable require-jsdoc */

import MQEmitter, { Message, MQEmitter as IMQEmitter } from 'mqemitter';
import AMQPLib from 'amqplib/callback_api';
import { EventEmitter } from 'events';
// import hyperid from 'hyperid';

export interface MQEmitterOptions {
  concurrency?: number
  matchEmptyLevels?: boolean
  separator?: string
  wildcardOne?: string
  wildcardSome?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function noop (): void {}

export class MQEmitterAMQPLib implements Omit<IMQEmitter, 'current' | 'concurrent'> {
  public amqp: typeof AMQPLib;
  protected state = new EventEmitter();
  private connection: AMQPLib.Connection | undefined;
  private channel?: AMQPLib.Channel;
  private readonly consumers: any[] = [];
  private readonly mqe: IMQEmitter;

  constructor (private readonly opts?: MQEmitterOptions) {
    this.mqe = MQEmitter(opts);
    this.amqp = AMQPLib;
  }

  startConnection (
    url: string, queues: string[]
  ): AMQPLib.Connection | undefined {
    if (this.connection === undefined) {
      this.amqp.connect(
        url, (
          err, connection
        ) => {
          if (err !== null) {
            console.log(err);
            return err;
          }

          console.log('successfully connected to amqp');
          this.connection = connection;

          this.connection.createChannel((
            err, channel
          ) => {
            if (err !== null) {
              console.log(err);
              return err;
            }

            console.log('successfully created amqp channel');

            this.channel = channel;
            const iterator = queues?.values();

            this.consumeQueues(
              iterator, iterator.next()
            );
          });
        }
      );
    }

    return this.connection;
  }

  on (
    topic: string,
    listener: (
      message: Message,
      done: () => void
    ) => void,
    callback?: () => void
  ): any {
    this.mqe.on(
      topic, listener, callback
    );
    return this;
  }

  private _emit (
    message: Message,
    callback?: (
      error?: Error
    ) => void
  ): void {
    // TODO: Must have different emition for on-emit and emit-on.

    // const packet = {
    //   id: hyperid(),
    //   msg: message
    // };

    this.mqe.emit(message);
  }

  emit (
    message: Message,
    callback?: (
      error?: Error
    ) => void
  ): void {
    // TODO: Must have different emition for on-emit and emit-on.

    // const packet = {
    //   id: hyperid(),
    //   msg: message
    // };

    this.mqe.emit(message);
  }

  removeListener (
    topic: string,
    listener: (
      message: Message,
      done: () => void
    ) => void,
    callback?: () => void
  ): void {
    this.mqe.removeListener(
      topic, listener, callback
    );
  }

  close (callback: () => void): void {
    this.mqe.close(callback);
  }

  private consumeQueues (
    values: IterableIterator<string>, actual: IteratorResult<string, any>
  ): void {
    if (actual.done !== true) {
      console.log(
        'consuming at queue %s on amqp', actual.value
      );
      this.consumers.push({
        queue: actual.value,
        listener: this.channel?.consume(
          actual.value, (message: AMQPLib.Message | null) => {
            console.log(
              'message received at queue %s', actual.value
            );
            if (message !== null) {
              if (message.content !== undefined) {
                const parsed: Message = JSON.parse(message.content.toString());
                this._emit(parsed);
              }

              this.channel?.ack(message);
            }
          }
        )
      });
      return this.consumeQueues(
        values, values.next()
      );
    }
  }

  private onError (err: Error | undefined): void {
    if ((err !== undefined)) {
      this.state.emit(
        'error', err
      );
    }
  }
}
