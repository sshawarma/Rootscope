import { EventType, ResponsibleProcess } from './fileSystemChangeEvent';
import { Device } from './hardwareEvent';

export interface EventHistory {
    eventId: number;
    eventType: EventType;
    processedAt: Date;
    timeOfEvent: Date;
    data: EventHistoryData;
}

export interface EventHistoryData {
    device?: Device;
    responsibleProcess?: ResponsibleProcess;
    status?: string;
    reason?: string
}
