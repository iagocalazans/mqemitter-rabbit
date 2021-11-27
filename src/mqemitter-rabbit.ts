/* eslint-disable require-jsdoc */

import MQEmitter, { Message, MQEmitter as IMQEmitter } from 'mqemitter';
import AMQPLib from 'amqplib/callback_api';
import { EventEmitter } from 'events';
import hyperid from 'hyperid';

export interface MQEmitterOptions {
  concurrency?: number
  matchEmptyLevels?: boolean
  separator?: string
  wildcardOne?: string
  wildcardSome?: string
}

interface Packet {
  id: hyperid.Instance
  body: Message
}

export class MQEmitterAMQPLib implements Omit<IMQEmitter, 'current' | 'concurrent' | 'emit'> {
  public amqp: typeof AMQPLib;
  public events = new EventEmitter();
  private connection: AMQPLib.Connection | undefined;
  private channel?: AMQPLib.Channel;
  private queues?: string[];
  private readonly consumers: any[] = [];
  private readonly mqe: IMQEmitter;
  private method?: 'listener' | 'publisher' | 'both';

  constructor (private readonly opts?: MQEmitterOptions) {
    this.mqe = MQEmitter(opts);
    this.amqp = AMQPLib;
  }

  startConnection (
    url: string, queues: string[], method: 'listener' | 'publisher' | 'both' = 'listener'
  ): AMQPLib.Connection | undefined {
    this.method = method;

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
            this.queues = queues;

            if (method === 'listener' || method === 'both') {
              const iterator = queues?.values();

              this.consumeQueues(
                iterator, iterator.next()
              );
            }
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
    if (this.method === 'publisher') {
      this.onError(new Error('you can\'t listen to messages, your connection method is publisher switch between both or listener'));
    }

    this.mqe.on(
      topic, listener, callback
    );

    return this;
  }

  emit (
    message: Message,
    queue: string,
    headers?: Record<string, unknown>,
    callback?: (
      error?: Error
    ) => void
  ): void {
    const cb = (callback !== undefined) ? callback : this.onError;

    if (this.method === 'listener') {
      return cb(new Error('you can\'t emit messages, your connection method is listener switch between both or publisher'));
    }

    if (this.queues?.find((el) => el === queue) === undefined) {
      return cb(new Error('this queue isnt loaded on this application, aborting'));
    }

    const packet: Packet = {
      id: hyperid(),
      body: message
    };

    const buffer = Buffer.from(JSON.stringify(packet));

    this.channel?.sendToQueue(
      queue, buffer, {
        headers
      }
    );
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

    this.consumers.splice(
      0, -1
    );
  }

  close (callback: () => void): void {
    this.mqe.close(callback);

    this.connection?.close();
    console.log('successfully closes amqp connection');
  }

  private _emit (
    message: Message,
    callback?: (
      error?: Error
    ) => void
  ): void {
    this.mqe.emit(
      message, callback
    );
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
                const packet: Packet = JSON.parse(message.content.toString());
                this._emit(packet.body);
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

  private readonly onError = (err: Error): void => {
    this.events.emit(
      'error', err
    );
  };
}
