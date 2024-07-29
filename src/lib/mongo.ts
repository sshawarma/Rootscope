import { Collection, MongoClient } from 'mongodb';
import {
    DaemonHardwareEvent,
    TransformedNode
} from '../providers/types/eventTypes';

class MongoDB {
    private static _instance: MongoDB;
    private client: MongoClient;
    private constructor() {
        try {
            this.client = new MongoClient(
                ''
            );
        } catch {
            console.log('Failed to establish mongo connection');
        }
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new MongoDB();
        return this._instance;
    }

    public insertDirectory = async (directory) => {
        this.client.connect();
        const collection: Collection = this.client
            .db('rootscope')
            .collection('directories');
        await collection.insertOne({ test: directory });
    };

    public insertNewDirectoryList = async (
        directoryList: TransformedNode[]
    ) => {
        const collection: Collection<TransformedNode> = this.client
            .db('rootscope')
            .collection('directories');
        const insertPromises = directoryList.map((directory) =>
            collection.insertOne({ ...directory, _id: directory._id })
        );
        await Promise.allSettled(insertPromises);
    };

    public insertHardwareEvent = async (event: DaemonHardwareEvent) => {
        const collection: Collection<DaemonHardwareEvent> = this.client
            .db('rootscope')
            .collection('hardwareEvents');
        await collection.insertOne(event);
    };
}

export default MongoDB;
