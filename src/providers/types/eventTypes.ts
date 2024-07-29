import { ObjectId } from 'mongodb';

export interface FileData {
    path: string;
    status: string;
    type: string;
    perm: string;
    date_created: number;
    du: number;
    cu_size: number;
    link: string | null;
    device: string | null;
    mounted: string | null;
    is_socket: number;
    is_fifo: number;
    _id?: ObjectId;
}

export interface DaemonFullScanEvent {
    data: FileData;
    children: DaemonFullScanEvent[];
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

export type EventDataType = DaemonFullScanEvent | DaemonHardwareEvent

export interface DaemonHardwareEvent {
    event_id: number;
    created_at: number;
    action: number;
    device: Device;
}
export interface DaemonEvent {
    event_type: EventType;
    event_data: DaemonFullScanEvent | DaemonHardwareEvent;
}

export interface TransformedNode {
    path: string;
    status: string;
    type: string;
    perm: string;
    date_created: number;
    du: number;
    cu_size: number;
    link: string | null;
    device: string | null;
    mounted: string | null;
    is_socket: number;
    is_fifo: number;
    _id?: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    children: ObjectId[];
}

export enum EventType {
    Unknown = 0,
    FullScan = 1,
    FilesystemChange = 2,
    NetworkChange = 3,
    HardwareChange = 4
}

export const fullScanEvent: DaemonEvent = {
    "event_type": 1,
    "event_data": {
        "data": {
            "path": "/home/martin/Documents/linux-visualizer/src/logger",
            "status": "success",
            "type": "directory",
            "perm": "rwxrwxr-x",
            "date_created": 1718674154,
            "du": 12288,
            "cu_size": 8192,
            "link": null,
            "device": null,
            "mounted": null,
            "is_socket": 0,
            "is_fifo": 0
        },
        "children": [
            {
                "data": {
                    "path": "/home/martin/Documents/linux-visualizer/src/logger/include",
                    "status": "success",
                    "type": "directory",
                    "perm": "rwxrwxr-x",
                    "date_created": 1718674154,
                    "du": 8192,
                    "cu_size": 6717,
                    "link": null,
                    "device": null,
                    "mounted": null,
                    "is_socket": 0,
                    "is_fifo": 0
                },
                "children": [
                    {
                        "data": {
                            "path": "/home/martin/Documents/linux-visualizer/src/logger/include/logger.h",
                            "status": "success",
                            "type": "file",
                            "perm": "rw-rw-r--",
                            "date_created": 1718674154,
                            "du": 4096,
                            "cu_size": 2621,
                            "link": null,
                            "device": null,
                            "mounted": null,
                            "is_socket": 0,
                            "is_fifo": 0
                        },
                        "children": []
                    }
                ]
            }
        ]
    }
}
