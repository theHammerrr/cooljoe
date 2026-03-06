import { EventEmitter } from 'node:events';
import { DraftJobEvent } from '../domain/draftQuery';

class DraftJobEventBus {
    private readonly emitter = new EventEmitter();
    private readonly eventName = 'draft-job-event';

    publish(event: DraftJobEvent): void {
        this.emitter.emit(this.eventName, event);
    }

    subscribe(handler: (event: DraftJobEvent) => void): () => void {
        this.emitter.on(this.eventName, handler);

        return () => this.emitter.off(this.eventName, handler);
    }
}

export const draftJobEventBus = new DraftJobEventBus();
