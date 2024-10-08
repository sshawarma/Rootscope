import { Collection, Db } from 'mongodb';

import MongoDB from './mongo';
import { DaemonStatusEvent } from './types/schema';

class DaemonStatusEventRepository {
    private static _instance: DaemonStatusEventRepository;
    private db: Db;
    private collection: Collection<DaemonStatusEvent>;

    private constructor() {
        try {
            const mongoDb: MongoDB = MongoDB.getInstance();

            this.db = mongoDb.db;

            this.collection = this.db.collection('statusEvents');
        } catch {
            console.log('Failed to establish mongo connection');
        }
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new DaemonStatusEventRepository();
        return this._instance;
    }

    public insertDaemonStatusEvent = async (event: DaemonStatusEvent) => {
        try {
            await this.collection.insertOne(event);
        } catch (error) {
            console.log(
                'DaemonStatusEventRepository.insertDaemonStatusEvent - Failed to insertOne',
                event,
                error
            );
        }
    };
}

export default DaemonStatusEventRepository;
