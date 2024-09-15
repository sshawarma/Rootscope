import { Collection, Db, DeleteResult, InsertOneResult } from 'mongodb';
import { Attrib, Directory } from './types/schema';
import { FileData } from '../providers/types/fullScanEvent';
import { dirname } from 'path';
import MongoDB from './mongo';

class DirectoriesRepository {
    private static _instance: DirectoriesRepository;
    private db: Db;
    private collection: Collection<Directory>;

    private constructor() {
        try {
            const mongoDb: MongoDB = MongoDB.getInstance();

            this.db = mongoDb.db;

            this.collection = this.db.collection('directories');
        } catch (error) {
            console.log('Failed to establish mongo connection', error);
        }
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new DirectoriesRepository();
        return this._instance;
    }

    public insertNewDirectoryList = async (directoryList: Directory[]) => {
        let insertPromises: Promise<InsertOneResult<Directory>>[];
        try {
            insertPromises = directoryList.map((directory) =>
                this.collection.insertOne({
                    ...directory,
                    _id: directory._id
                })
            );
        } catch (error) {
            console.log(
                'DirectoriesRepository.insertNewDirectoryList - Failed to insertOne: ',
                insertPromises,
                error
            );
        }
        await Promise.allSettled(insertPromises);
    };

    public updateAttributes = async (
        path: string,
        attrib: Attrib
    ): Promise<Boolean> => {
        try {
            const now: Date = new Date();
            const document: Directory = await this.collection.findOneAndUpdate(
                { path },
                { $set: { attrib, updatedAt: now, modifiedAt: now } }
            );

            return !!document;
        } catch (error) {
            console.log(
                'DirectoriesRepository.updateAttributes - Failed to findOneAndUpdate: ',
                path,
                attrib,
                error
            );
        }
    };

    public updateDirectoryData = async (
        path: string,
        data: FileData
    ): Promise<Boolean> => {
        try {
            const now: Date = new Date();
            const document: Directory = await this.collection.findOneAndUpdate(
                { path },
                { $set: { ...data, updatedAt: now, modifiedAt: now } }
            );

            return !!document;
        } catch (error) {
            console.log(
                'DirectoriesRepository.updateDirectoryData - Failed to findOneAndUpdate: ',
                path,
                data,
                error
            );
        }
    };

    public updateModifiedAt = async (path: string): Promise<Boolean> => {
        try {
            const now: Date = new Date();
            const document: Directory = await this.collection.findOneAndUpdate(
                { path },
                { $set: { updatedAt: now, modifiedAt: now } }
            );

            return !!document;
        } catch (error) {
            console.log(
                'DirectoriesRepository.updateModifiedAt - Failed to findOneAndUpdate: ',
                path,
                error
            );
        }
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
        try {
            const regex = this.generateParentPathRegex(path);
            return this.collection.updateMany(
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
        } catch (error) {
            console.log(
                'DirectoriesRepository.updateDuAndCuSize - Failed to updateMany: ',
                path,
                duDifference,
                cuDifference,
                error
            );
        }
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
        let rootDirectoryToDelete: Directory;
        try {
            rootDirectoryToDelete = await this.collection.findOne({
                path
            });

            if (!rootDirectoryToDelete) {
                console.log(
                    'DirectoriesRepository.deleteDirectoryAndChildren - Directory to delete not found'
                );

                return;
            }
        } catch (error) {
            console.log(
                'DirectoriesRepository.deleteDirectoryAndChildren - Failed to findOne',
                path,
                error
            );
        }
        try {
            const duDifference: number = rootDirectoryToDelete.du * -1;
            const cuDifference: number = rootDirectoryToDelete.cu_size * -1;
            const deleteObject: DeleteResult = await this.collection.deleteMany(
                {
                    path: { $regex: regex }
                }
            );
            const deletedCount: number = deleteObject.deletedCount;
            console.log(deletedCount);
            if (deletedCount > 0)
                await this.updateDuAndCuSize(path, duDifference, cuDifference);
        } catch (error) {
            console.log(
                'DirectoriesRepository.deleteDirectoryAndChildren - Failed to updateMany',
                path,
                error
            );
        }
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
        const directoryToCreate: Directory = directories.find(
            (directory) => !directory.parentId
        );

        if (!directoryToCreate) {
            console.log(
                'All directories have a parent? Error in transforming the tree'
            );
            return;
        }

        const pathOneLevelUp: string = dirname(path);
        let directoryAtPath: Directory;
        try {
            directoryAtPath = await this.collection.findOneAndUpdate(
                { path: pathOneLevelUp },
                { $push: { children: directoryToCreate.path } }
            );
        } catch (error) {
            console.log(
                'DirectoriesRepository.createDirectoriesAndUpdateSizes - Failed at 1st findOneAndUpdate',
                path,
                directoryToCreate,
                error
            );
            return;
        }

        if (!directoryAtPath) {
            console.log(
                `During file system create no directory was found at: ${path}.`
            );

            return;
        }

        await this.insertNewDirectoryList(directories);

        await this.updateDuAndCuSize(
            pathOneLevelUp,
            directoryToCreate.du,
            directoryToCreate.cu_size
        );
        try {
            await this.collection.findOneAndUpdate(
                { _id: directoryToCreate._id },
                { $set: { parentId: directoryAtPath._id } }
            );
        } catch (error) {
            console.log(
                'DirectoriesRepository.createDirectoriesAndUpdateSizes - Failed at second findOneAndUpdate',
                path,
                directoryToCreate,
                error
            );
        }
    };
}

export default DirectoriesRepository;
