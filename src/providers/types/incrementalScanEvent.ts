import { DaemonFullScanEvent } from './fullScanEvent';

export interface IncrementalScanEvent {
    event_id?: number;
    events: DaemonFullScanEvent[];
}
