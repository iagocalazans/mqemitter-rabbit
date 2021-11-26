/* eslint-disable require-jsdoc */

import { Message } from 'mqemitter';

export class PublishMessage implements Message {
  constructor (
    public topic: string, content?: Record<string, unknown>
  ) {
    this.topic = topic;

    if (content !== undefined) {
      Object.keys(content).forEach((key) => {
        Object.defineProperty(
          this, key, {
            enumerable: true,
            writable: false,
            value: content[key]
          }
        );
      });
    }

    return this;
  }
}
