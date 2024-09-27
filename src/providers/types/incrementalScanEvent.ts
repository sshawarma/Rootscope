import { DaemonFullScanEvent } from './fullScanEvent';

export interface IncrementalScanEvent {
    events: DaemonFullScanEvent[];
}
