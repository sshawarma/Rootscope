import { ObjectId } from 'mongodb';

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
    update_children?: Boolean;
    path: string;
    status: string;
    type: string;
    attrib: Attrib;
    date_created: number;
    du: number;
    cu_size: number;
    link?: string;
    device?: string;
    mounted?: string;
    is_socket: number;
    is_fifo: number;
    _id?: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    modifiedAt?: Date;
    children: ObjectId[];
}
