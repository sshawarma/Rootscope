import { DaemonFullScanEvent } from './fullScanEvent';

export enum EventType {
    Unknown = 0,
    FullScan = 1,
    FilesystemChange = 2,
    NetworkChange = 3,
    HardwareChange = 4,
    DaemonStatus = 5,
    IncrementalScan = 6
}

export interface ProcessId {
    real_id: number;
    effective_id: number;
    saved_set_id: number;
    filesystem_id: number;
}

export interface ResponsibleProcess {
    uid: ProcessId;
    gid: ProcessId;
    pid: number;
    parents: ProcessParent[];
    name: string;
}

export interface ProcessParent {
    name: String;
    pid: String;
    uid: String;
    gid: String;
}

export interface FileSystemChangeEvent {
    new_data: DaemonFullScanEvent;
    event_id: number;
    created_at: number;
    location: string;
    actions: number;
    syscalls: string[];
    responsible_process: ResponsibleProcess;
}

export interface DaemonFileSystemChangeEvent {
    num_events: number;
    events: FileSystemChangeEvent[];
}
