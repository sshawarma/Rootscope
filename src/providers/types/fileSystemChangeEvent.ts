import { DaemonFullScanEvent } from './fullScanEvent';

export enum EventType {
    UNKNOWN = 0,
    FULL_SCAN = 1,
    FILESYSTEM_CHANGE = 2,
    NETWORK_CHANGE = 3,
    HARDWARE_CHANGE = 4,
    DAEMON_STATUS = 5,
    INCREMENTAL_SCAN = 6,
    VOLATILE_EVENT = 7
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
    executable_path: string;
    parents: ProcessParent[];
    name: string;
}

export interface ProcessParent {
    name: string;
    pid: number;
    uid: number;
    gid: number;
    executable_path: string;
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

export interface VolatileEvent extends FileSystemChangeEvent {}
