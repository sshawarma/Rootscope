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
