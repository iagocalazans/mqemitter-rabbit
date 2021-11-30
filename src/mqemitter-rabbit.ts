/* eslint-disable require-jsdoc */

import MQEmitter, { Message, MQEmitter as IMQEmitter } from 'mqemitter';
import AMQPLib from 'amqplib/callback_api';
import { EventEmitter } from 'events';
import hyperid from 'hyperid';

export enum ApplicationType {
  LISTENER = 'listener',
  PUBLISHER = 'publisher',
  BOTH = 'both'
}

export interface IStartOptions {
  url: string
  queues: string[]
  method: ApplicationType
}

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

interface PacketMessage extends Packet {
  message: AMQPLib.Message
}

export { MessageFactory } from './factory/factory.class';

export class MQEmitterAMQPLib implements Omit<IMQEmitter, 'current' | 'concurrent' | 'emit'> {
  public amqp: typeof AMQPLib;
  public events = new EventEmitter();
  private connection?: AMQPLib.Connection;
  private channel?: AMQPLib.Channel;
  private queues?: string[];
  private method?: ApplicationType;
  private readonly consumers: any[] = [];
  private readonly mqemitter: IMQEmitter;
  private readonly packets: PacketMessage[] = [];

  constructor (private readonly opts?: MQEmitterOptions) {
    this.mqemitter = MQEmitter(opts);
    this.amqp = AMQPLib;
  }

  startConnection (
    config: IStartOptions,
    callback: (
      err?: Error,
      next?: MQEmitterAMQPLib
    ) => void
  ): void {
    this.method = config.method;

    if (this.connection === undefined) {
      this.amqp.connect(
        config.url, (
          err, connection
        ) => {
          if (err !== null) {
            console.log(err);
            return callback(err);
          }

          console.log('[ * ] Successfully connected to RabbitMQ.');
          this.connection = connection;

          this.connection.createChannel((
            err, channel
          ) => {
            if (err !== null) {
              console.log(err);
              return callback(err);
            }

            console.log('[ * ] Successfully created AMQP channel.');
            this.channel = channel;
            this.queues = config.queues;

            if (config.method === 'listener' || config.method === 'both') {
              const iterator = config.queues?.values();

              this.consumeQueues(
                iterator, iterator.next()
              );
            }

            return callback(
              undefined, this
            );
          });
        }
      );
    }
  }

  /**
   * When using this function you must work inside listener to control the message acknowledge. This module exports three functions, retry, discard, release to manage the queue process with the related message.
   *
   * @param {string} topic
   * @param {Function} listener
   * @param {Function} callback
   * @return {any}
   */
  on (
    topic: string,
    listener: (
      message: Message,
      done: () => void,
    ) => void,
    callback?: () => void
  ): any {
    if (this.method === 'publisher') {
      this.onError(new Error('[ ! ] You can\'t listen to messages, your connection method is publisher switch between both or listener'));
    }

    this.mqemitter.on(
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
      return cb(new Error('[ ! ] You can\'t emit messages, your connection method is listener switch between both or publisher'));
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
    this.mqemitter.removeListener(
      topic, listener, callback
    );

    this.consumers.splice(
      0, -1
    );
  }

  retry (message: Message): void {
    const packet = this.packets.find((packet) => packet.body === message);
    if (packet !== undefined) {
      this.packets.splice(
        this.packets.indexOf(packet), 1
      );

      return this.channel?.nack(
        packet?.message, false, true
      );
    }
  }

  discard (message: Message): void {
    const packet = this.packets.find((packet) => packet.body === message);
    if (packet !== undefined) {
      this.packets.splice(
        this.packets.indexOf(packet), 1
      );

      return this.channel?.nack(
        packet?.message, false, false
      );
    }
  }

  release (message: Message): void {
    const packet = this.packets.find((packet) => packet.body === message);
    if (packet !== undefined) {
      this.packets.splice(
        this.packets.indexOf(packet), 1
      );

      console.log(this.packets);

      return this.channel?.ack(packet?.message);
    }
  }

  close (callback: () => void): void {
    this.mqemitter.close(callback);

    this.connection?.close();
    console.log('successfully closes amqp connection');
  }

  private _emit (
    message: Message,
    callback?: (
      error?: Error
    ) => void
  ): void {
    this.mqemitter.emit(
      message, callback
    );
  }

  private consumeQueues (
    values: IterableIterator<string>, actual: IteratorResult<string, any>
  ): void {
    if (actual.done !== true) {
      console.log(
        '[ * ] Consuming AMQP queue %s', actual.value
      );
      this.consumers.push({
        queue: actual.value,
        listener: this.channel?.consume(
          actual.value, (message: AMQPLib.Message | null) => {
            console.log(
              'New message received on Queue: %s', actual.value
            );
            if (message !== null) {
              if (message.content !== undefined) {
                const packet: Packet = JSON.parse(message.content.toString());
                const _toStore: PacketMessage = {
                  message,
                  ...packet
                };
                this.packets.push(_toStore);
                this._emit(
                  packet.body, (err) => {
                    if (err != null) {
                      console.log(err);
                      return this.discard(packet.body);
                    }
                  }
                );
              }
            }
          }, {
            noAck: false
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
