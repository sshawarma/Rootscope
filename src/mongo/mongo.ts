import { Collection, DeleteResult, MongoClient } from 'mongodb';
import { Attrib, Directory } from './types/schema';
import { DaemonHardwareEvent } from '../providers/types/hardwareEvent';
import { DaemonFileSystemChangeEvent } from '../providers/types/fileSystemChangeEvent';
import { FileData } from '../providers/types/fullScanEvent';

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
                .collection('Copy_of_directories');
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
        const now: Date = new Date();
        const document: Directory =
            await this.directoriesCollection.findOneAndUpdate(
                { path },
                { $set: { attrib, updatedAt: now, modifiedAt: now } }
            );

        console.log(document);

        return !!document;
    };

    public updateDirectoryData = async (
        path: string,
        data: FileData
    ): Promise<Boolean> => {
        const now: Date = new Date();
        const document: Directory =
            await this.directoriesCollection.findOneAndUpdate(
                { path },
                { $set: { ...data, updatedAt: now, modifiedAt: now } }
            );

        console.log(document);

        return !!document;
    };

    public updateModifiedAt = async (path: string): Promise<Boolean> => {
        const now: Date = new Date();
        const document: Directory =
            await this.directoriesCollection.findOneAndUpdate(
                { path },
                { $set: { updatedAt: now, modifiedAt: now } }
            );

        console.log(document);

        return !!document;
    };
    /*
     Function to generate regex patterns for the exact path and its parent directories
     Returns: A regex of an exact match for the path and parent directories
     */
    private generateParentPathRegex = (path: string) => {
        const pathParts = path.split('/').filter(Boolean); // Split the path and filter out empty parts
        const regexPatterns = pathParts.map(
            (_, i) => `^/${pathParts.slice(0, i + 1).join('/')}$`
        );
        const joinedRegexPatterns = regexPatterns.join('|');
        return new RegExp(joinedRegexPatterns);
    };

    /*
    The first part of this operation will find every directory that is hierarchically higher than the provided path
    Secondly it will update each of those records values by the passed values
    The use of regex is unfortunate, but this completes the recursive operation in a linear way
    The provided path argument must not end with a "/"
    */
    public updateDuAndCuSize = async (
        path: string,
        duDifference: number,
        cuDifference: number
    ) => {
        const regex = this.generateParentPathRegex(path);
        return this.directoriesCollection.updateMany(
            {
                $or: [
                    { path: path },
                    {
                        path: {
                            $regex: regex
                        }
                    }
                ]
            },
            { $inc: { du: duDifference, cu_size: cuDifference } }
        );
    };

    public deleteDirectoryAndChildren = async (path: string) => {
        const regexDeleteDirectoryAndChildrenPatternString = `^${path}(?:/[^/]+)*$`;
        const regex: RegExp = new RegExp(
            regexDeleteDirectoryAndChildrenPatternString
        );

        const rootDirectoryToDelete: Directory =
            await this.directoriesCollection.findOne({ path });

        if (!rootDirectoryToDelete) {
            console.log('Directory to delete not found');
            return;
        }
        const duDifference: number = rootDirectoryToDelete.du * -1;
        const cuDifference: number = rootDirectoryToDelete.cu_size * -1;
        const deleteObject: DeleteResult =
            await this.directoriesCollection.deleteMany({
                path: { $regex: regex }
            });
        const deletedCount: number = deleteObject.deletedCount;
        console.log(deletedCount);
        if (deletedCount > 0)
            await this.updateDuAndCuSize(path, duDifference, cuDifference);
    };
}

export default MongoDB;
