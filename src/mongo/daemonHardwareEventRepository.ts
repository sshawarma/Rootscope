import { Collection, Db, MongoClient } from 'mongodb';
import { DaemonHardwareEvent } from '../providers/types/hardwareEvent';
import MongoDB from './mongo';

class DaemonHardwareEventRepository {
    private static _instance: DaemonHardwareEventRepository;
    private db: Db;
    private collection: Collection<DaemonHardwareEvent>;

    private constructor() {
        try {
            const mongoDb: MongoDB = MongoDB.getInstance();

            this.db = mongoDb.db;

            this.collection = this.db.collection('hardwareEvents');
        } catch {
            console.log('Failed to establish mongo connection');
        }
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new DaemonHardwareEventRepository();
        return this._instance;
    }

    public insertHardwareEvent = async (event: DaemonHardwareEvent) => {
        await this.collection.insertOne(event);
    };
}

export default DaemonHardwareEventRepository;
