import { Collection, Db, DeleteResult, MongoClient } from 'mongodb';
import { dirname } from 'path';

import { Attrib, Directory } from './types/schema';
import { DaemonHardwareEvent } from '../providers/types/hardwareEvent';
import { FileData } from '../providers/types/fullScanEvent';
import { EventPacket } from '../providers/types/daemonEvent';
import { DaemonFileSystemChangeEvent } from '../providers/types/fileSystemChangeEvent';

class MongoDB {
    private static _instance: MongoDB;
    private client: MongoClient;
    private directoriesCollection: Collection<Directory>;
    private hardwareEventsCollection: Collection<DaemonHardwareEvent>;
    private fileSystemChangeEventsCollection: Collection<DaemonFileSystemChangeEvent>;
    private eventPacketsCollection: Collection<EventPacket>;

    private constructor() {
        try {
            this.client = new MongoClient(process.env.MONGO_URI);
            this.client.connect();

            const db: Db = this.client.db('rootscope');

            this.directoriesCollection = db.collection('directories');
            this.hardwareEventsCollection = db.collection('hardwareEvents');
            this.eventPacketsCollection = db.collection('eventPackets');
            this.fileSystemChangeEventsCollection = db.collection(
                'fileSystemChangeEvents'
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

    public insertEventPacket = async (eventPacket: EventPacket) => {
        await this.eventPacketsCollection.insertOne(eventPacket);
    };

    public queryEventPackets = async (message_id: string) => {
        return this.eventPacketsCollection.find({ message_id }).toArray(); // is there a better way to do this instead of checking arr length
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

        console.log('attr', document);

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

        return !!document;
    };

    public updateModifiedAt = async (path: string): Promise<Boolean> => {
        const now: Date = new Date();
        const document: Directory =
            await this.directoriesCollection.findOneAndUpdate(
                { path },
                { $set: { updatedAt: now, modifiedAt: now } }
            );


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

    /*
    Uses the passed path to delete any dir equal to or deeper then it
    Subtracts CU and DU size of all paths higher then the provided path
    */
    public deleteDirectoryAndChildren = async (path: string) => {
        const regexDeleteDirectoryAndChildrenPatternString = `^${path}(?:/[^/]+)*$`; // will match to any path equal to or deeper than
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

    /*
    Inserts the directories similar to the full scan
    Updates the children array of the directory we inserted into
    Updates the CU and DU size of all records higher then the passed path
    If there is a parent dir then we assign its Id as the inserted directories parentId
     */
    public createDirectoriesAndUpdateSizes = async (
        directories: Directory[],
        path: string
    ) => {
        await this.insertNewDirectoryList(directories);
        const topLevelCreateDirectory: Directory = directories.find(
            (directory) => !directory.parentId
        );

        const pathOneLevelUp: string = dirname(path);
        const directoryAtPath: Directory =
            await this.directoriesCollection.findOneAndUpdate(
                { path: pathOneLevelUp },
                { $push: { children: topLevelCreateDirectory._id } }
            );

        await this.updateDuAndCuSize(
            pathOneLevelUp,
            topLevelCreateDirectory.du,
            topLevelCreateDirectory.cu_size
        );
        if (!directoryAtPath) {
            console.log(
                'During file system create no directory was found at: ',
                path
            );
            return;
        }
        await this.directoriesCollection.findOneAndUpdate(
            { _id: topLevelCreateDirectory._id },
            { $set: { parentId: directoryAtPath._id } }
        );
    };
}

export default MongoDB;
