import { Collection, Db, MongoClient } from 'mongodb';
import { DaemonFileSystemChangeEvent } from '../providers/types/fileSystemChangeEvent';
import MongoDB from './mongo';

class DaemonFileSystemChangeEventRepository {
    private static _instance: DaemonFileSystemChangeEventRepository;
    private db: Db;
    private collection: Collection<DaemonFileSystemChangeEvent>;

    private constructor() {
        try {
            const mongoDb: MongoDB = MongoDB.getInstance();

            this.db = mongoDb.db;

            this.collection = this.db.collection('fileSystemChangeEvents');
        } catch {
            console.log('Failed to establish mongo connection');
        }
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new DaemonFileSystemChangeEventRepository();
        return this._instance;
    }

    public insertFileSystemChangeEvent = async (
        event: DaemonFileSystemChangeEvent
    ) => {
        await this.collection.insertOne(event);
    };
}

export default DaemonFileSystemChangeEventRepository;