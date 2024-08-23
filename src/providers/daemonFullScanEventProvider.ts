import { ObjectId } from 'mongodb';
import MongoDB from '../mongo/mongo';
import { Directory } from '../mongo/types/schema';
import { DaemonFullScanEvent } from './types/fullScanEvent';
import { transformTree } from '../lib/transformTree';

class FullScanEventProvider {
    private static _instance: FullScanEventProvider;

    private mongo: MongoDB;

    private constructor() {
        this.mongo = MongoDB.getInstance();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new FullScanEventProvider();
        return this._instance;
    }

    public process = async (event: DaemonFullScanEvent): Promise<void> => {
        const transformedDirectory: Directory[] = transformTree(event);
        await this.mongo.insertNewDirectoryList(transformedDirectory);
    };
}

export default FullScanEventProvider;
