import { ObjectId } from 'mongodb';
import { Link, MountData } from '../../providers/types/fullScanEvent';

export interface Attrib {
    perm: number;
    xattr: number;
    inode: number;
    filesystem: string;
    owner_id: number;
    owner_name: string;
    group_id: number;
    group_name: string;
    group_members: string[];
}

export interface Directory {
    parentId?: ObjectId;
    path: string;
    status: string;
    type: string;
    attrib: Attrib;
    date_created: number;
    du: number;
    cu_size: number;
    link: Link | null;
    device: string | null;
    mounted: MountData | null;
    is_socket: number;
    is_fifo: number;
    _id?: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    modifiedAt?: number;
    fileChildren: string[];
    directoryChildren: string[];
}

export interface FileData {
    path: string;
    status: string;
    type: string;
    attrib: Attrib;
    date_created: number;
    du: number;
    cu_size: number;
    link: Link | null;
    device: string | null;
    mounted: MountData | null;
    is_socket: number;
    is_fifo: number;
    _id?: ObjectId;
    parentId?: ObjectId;
    date_modified?: number;
    update_children?: boolean;
}

export interface DaemonFullScanEvent {
    data: FileData;
    children: DaemonFullScanEvent[];
}

export interface EventHistory {
    eventId: number;
    eventType: EventType;
    processedAt: Date;
    timeOfEvent: Date;
}

export interface DeviceUserInterface {
    type: string;
    minor: number;
    major: number;
}

export interface Device {
    device_name: string;
    device_kernel_location: string;
    device_user_access_point: string;
    device_subsystem: string;
    device_user_interface: DeviceUserInterface;
}

export interface DaemonHardwareEvent {
    event_id: number;
    created_at: number;
    action: number;
    device: Device;
}

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

export interface DaemonStatusEvent {
    event_id?: number;
    created_at: number;
    status: string;
    reason: string;
}

export interface IncrementalScanEvent {
    event_id?: number;
    events: DaemonFullScanEvent[];
}
