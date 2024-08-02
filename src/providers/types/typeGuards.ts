import { DaemonFileSystemChangeEvent } from './fileSystemChangeEvent';
import { DaemonFullScanEvent } from './fullScanEvent';
import { DaemonHardwareEvent } from './hardwareEvent';

export const isDaemonFullScanEvent = (obj: any): obj is DaemonFullScanEvent => {
    return obj?.data?.status && obj?.children;
};

export const isDaemonHardwareEvent = (obj: any): obj is DaemonHardwareEvent => {
    return obj?.data?.status && obj?.children;
};

export const isDaemonFileSystemChangeEvent = (
    obj: any
): obj is DaemonFileSystemChangeEvent => {
    return obj?.events;
};
