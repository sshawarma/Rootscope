import { ObjectId } from 'mongodb';
import { Attrib, Link, MountData } from '../../providers/types/fullScanEvent';
import { EventPacket } from '../../providers/types/daemonEvent';

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

export interface MongoEventPacket extends EventPacket {
    createdAt: Date;
}
