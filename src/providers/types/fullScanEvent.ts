import { ObjectId } from 'mongodb';

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

export enum FileDataType {
    DIRECTORY = 'directory',
    FILE = 'file'
}

export enum Status {
    UPDATED = 'updated',
    DELETED = 'deleted',
    SUCCESS = 'success'
}

export interface MountData {
    mount_point: string;
    mount_origin: string;
    mount_type: string;
    mnt_opt: number;
    mnt_freq: number;
    mnt_passno: number;
}

export interface Link {
    state: string;
    path: string;
    target: string;
}

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

export interface DaemonFullScanEvent {
    event_id?: number;
    data: FileData;
    children: DaemonFullScanEvent[];
}
