import { EventType } from './fileSystemChangeEvent';

export interface EventHistory {
    eventId: number;
    eventType: EventType;
    processedAt: Date;
    timeOfEvent: Date;
}
