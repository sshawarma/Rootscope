import { EventType } from './fileSystemChangeEvent';

export interface ErrorMessage {
    errorType: ErrorType;
    eventType: EventType;
    lastSuccesfulEventTime: number;
    data: ErrorData;
}

export interface ErrorData {
    path?: string;
    eventId: number;
}

export enum ErrorType {
    OUT_OF_ORDER,
    UNKNOWN_PATH
}
