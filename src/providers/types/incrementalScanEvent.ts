import { DaemonFullScanEvent } from './fullScanEvent';

export interface IncrementalScanEvent {
    event_id?: number;
    created_at: number;
    events: DaemonFullScanEvent[];
}
