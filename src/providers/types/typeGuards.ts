import { DaemonStatusEvent } from './daemonEvent';
import {
    DaemonFileSystemChangeEvent,
    VolatileEvent
} from './fileSystemChangeEvent';
import { DaemonFullScanEvent, DaemonFullScanEventData } from './fullScanEvent';
import { DaemonHardwareEvent } from './hardwareEvent';
import { IncrementalScanEvent } from './incrementalScanEvent';

export const isDaemonFullScanEvent = (obj: any): obj is DaemonFullScanEvent => {
    return obj?.data?.status && obj?.children;
};

export const isDaemonFullScanEventData = (obj:any): obj is DaemonFullScanEventData => {
    return obj?.data?.data?.status && obj.event_id
}

export const isDaemonHardwareEvent = (obj: any): obj is DaemonHardwareEvent => {
    return obj?.data?.status && obj?.children;
};

export const isDaemonFileSystemChangeEvent = (
    obj: any
): obj is DaemonFileSystemChangeEvent => {
    return obj?.events;
};

export const isVolatileEvent = (obj: any): obj is VolatileEvent => {
    return obj.responsible_process;
};

export const isDaemonStatusEvent = (obj: any): obj is DaemonStatusEvent => {
    return obj?.status && obj?.reason;
};

export const isIncrementalScanEvent = (
    obj: any
): obj is IncrementalScanEvent => {
    return obj?.events;
};
