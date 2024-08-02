import { Collection, MongoClient } from 'mongodb';
import { Attrib, Directory } from './types/schema';
import { DaemonHardwareEvent } from '../providers/types/hardwareEvent';
import { DaemonFileSystemChangeEvent } from '../providers/types/fileSystemChangeEvent';

class MongoDB {
    private static _instance: MongoDB;
    private client: MongoClient;
    private directoriesCollection: Collection<Directory>;
    private hardwareEventsCollection: Collection<DaemonHardwareEvent>;
    private fileSystemChangeEventsCollection: Collection<DaemonFileSystemChangeEvent>;

    private constructor() {
        try {
            this.client = new MongoClient(process.env.MONGO_URI);
            this.client.connect();

            this.directoriesCollection = this.client
                .db('rootscope')
                .collection('directories');
            this.hardwareEventsCollection = this.client
                .db('rootscope')
                .collection('hardwareEvents');
            this.fileSystemChangeEventsCollection = this.client
                .db('rootscope')
                .collection('fileSystemChangeEvents');
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

    public insertNewDirectoryList = async (directoryList: Directory[]) => {
        const insertPromises = directoryList.map((directory) =>
            this.directoriesCollection.insertOne({
                ...directory,
                _id: directory._id
            })
        );
        await Promise.allSettled(insertPromises);
    };

    public insertHardwareEvent = async (event: DaemonHardwareEvent) => {
        await this.hardwareEventsCollection.insertOne(event);
    };

    public insertFileSystemChangeEvent = async (
        event: DaemonFileSystemChangeEvent
    ) => {
        await this.fileSystemChangeEventsCollection.insertOne(event);
    };

    public updateAttributes = async (
        path: string,
        attrib: Attrib
    ): Promise<Boolean> => {
        const document: Directory =
            await this.directoriesCollection.findOneAndUpdate(
                { path },
                { $set: { attrib, updatedAt: new Date() } }
            );

        console.log(document);

        return !!document;
    };
}

export default MongoDB;
