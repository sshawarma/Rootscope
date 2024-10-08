import { Collection, Db } from 'mongodb';

import MongoDB from './mongo';
import { DaemonFileSystemChangeEvent } from './types/schema';

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
        try {
            await this.collection.insertOne(event);
        } catch (error) {
            console.log(
                'DaemonFileSystemChangeEventRepository.insertFileSystemChangeEvent - Failed to insertOne',
                event,
                error
            );
        }
    };
}

export default DaemonFileSystemChangeEventRepository;
