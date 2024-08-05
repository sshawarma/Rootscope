import { ObjectId } from 'mongodb';

export interface FileData {
    path: string;
    status: string;
    type: string;
    attrib: Attrib;
    date_created: number;
    du: number;
    cu_size: number;
    link: string | null;
    device: string | null;
    mounted: string | null;
    is_socket: number;
    is_fifo: number;
    _id?: ObjectId;
    parentId?: ObjectId;
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
    data: FileData;
    children: DaemonFullScanEvent[];
}
