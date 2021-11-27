import { Message } from 'mqemitter';
import { PublishMessage } from './publish-message.class';

/* eslint-disable require-jsdoc */
abstract class Factory {
  public abstract generate (
    topic: string,
    content: Record<string, unknown>
  ): Message;
}

export class MessageFactory extends Factory {
  public generate (
    topic: string, content?: Record<string, unknown>
  ): Message {
    return new PublishMessage(
      topic, content
    );
  }
}
