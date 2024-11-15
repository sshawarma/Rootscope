import {
    DaemonFileSystemChangeEvent,
    EventType,
    VolatileEvent
} from '../types/fileSystemChangeEvent';
import { DaemonFullScanEvent, DaemonFullScanEventData } from './fullScanEvent';
import { DaemonHardwareEvent } from './hardwareEvent';
import { IncrementalScanEvent } from './incrementalScanEvent';

export interface DaemonEvent {
    event_type: EventType;
    event_data: EventData;
}

export interface EventPacket {
    message_id: string;
    total_packets: number;
    event_type: number;
    sequence_number: number;
    packed_data: string;
}

export interface DaemonStatusEvent {
    event_id?: number;
    created_at: number;
    status: string;
    reason: string;
}

export type EventData =
    | DaemonFullScanEventData
    | DaemonHardwareEvent
    | DaemonFileSystemChangeEvent
    | DaemonStatusEvent
    | IncrementalScanEvent
    | VolatileEvent;
