import { DaemonFullScanEvent } from "./eventTypes";

export const isDaemonFullScanEvent = (obj: any): obj is DaemonFullScanEvent => {
    return obj?.data?.status && obj?.children;
};

export const isDaemonHardwareEvent = (obj: any): obj is DaemonFullScanEvent => {
    return obj?.data?.status && obj?.children;
};
