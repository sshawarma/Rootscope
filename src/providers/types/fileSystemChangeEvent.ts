import { DaemonFullScanEvent } from './fullScanEvent';

export enum EventType {
    Unknown = 0,
    FullScan = 1,
    FilesystemChange = 2,
    NetworkChange = 3,
    HardwareChange = 4,
    DaemonStatus = 5
}

export interface ProcessId {
    real_id: number;
    effective_id: number;
    saved_set_id: number;
    filesystem_id: number;
}

export interface ResponsibleProcess {
    user_id: ProcessId;
    group_id: ProcessId;
    process_id: number;
    parent_process_id: number;
    process_name: string;
    parent_process_name: string;
}

export interface FileSystemChangeEvent {
    new_data: DaemonFullScanEvent;
    event_id: number;
    created_at: number;
    location: string;
    actions: number;
    responsible_process: ResponsibleProcess;
}

export interface DaemonFileSystemChangeEvent {
    num_events: number;
    events: FileSystemChangeEvent[];
}
