import {
    Collection,
    Db,
    DeleteResult,
    Document,
    InsertOneResult,
    ObjectId
} from 'mongodb';

import { dirname } from 'path';
import { mapFileDataToDirectories } from '../lib/transformTree';
import {
    Attrib,
    DaemonFullScanEvent,
    FileData
} from '../providers/types/fullScanEvent';
import MongoDB from './mongo';
import { Directory } from './types/schema';

const COLLECTION: string = 'directories';

export interface UpdateDirectoryForIncrementalScanResult {
    parentDirectoryId: ObjectId;
    parentDirectoryInDb: Directory;
}

class DirectoriesRepository {
    private static _instance: DirectoriesRepository;
    private db: Db;
    private collection: Collection<Directory>;

    private constructor() {
        try {
            const mongoDb: MongoDB = MongoDB.getInstance();

            this.db = mongoDb.db;

            this.collection = this.db.collection(COLLECTION);
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
        attrib: Attrib,
        modifiedAt: number
    ): Promise<Boolean> => {
        try {
            const now: Date = new Date();
            const document: Directory = await this.collection.findOneAndUpdate(
                { path },
                { $set: { attrib, updatedAt: now, modifiedAt } }
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
                { $set: { ...data, updatedAt: now } },
                { returnDocument: 'before' }
            );

            const duDifference: number = data.du - document.du;
            const cuDifference: number = data.cu_size - document.cu_size;
            await this.updateDuAndCuSize(path, duDifference, cuDifference);

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

    public updateModifiedAt = async (
        path: string,
        modifiedAt: number
    ): Promise<Boolean> => {
        try {
            const now: Date = new Date();
            const document: Directory = await this.collection.findOneAndUpdate(
                { path },
                { $set: { updatedAt: now, modifiedAt } }
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
    TODO: Change all regex queries to $in operations
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
    TODO: Update all regex with $in operation
    */
    public deleteDirectoryAndChildren = async (path: string) => {
        const regexDeleteDirectoryAndChildrenPatternString = `^${path}(?:/[^/]+)*$`; // will match to any path equal to or deeper than
        const regex: RegExp = new RegExp(
            regexDeleteDirectoryAndChildrenPatternString
        );

        const rootDirectoryToDelete: Directory = await this.findDirectoryAtPath(
            path
        );

        if (!rootDirectoryToDelete) {
            console.log(
                'DirectoriesRepository.deleteDirectoryAndChildren - Directory to delete not found'
            );

            return;
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
                'DirectoriesRepository.deleteDirectoryAndChildren - Failed to deleteMany',
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
                { $push: { directoryChildren: directoryToCreate.path } }
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

    public deleteSinglePathAndUpdateCuDu = async (path: string) => {
        let directory: Directory;
        try {
            directory = await this.collection.findOneAndDelete({ path });
            if (!directory) {
                console.log(
                    'DirectoriesRepository.deleteSinglePathAndUpdateCuDu - Directory to delete not found, skipping',
                    path
                );
                return;
            }

            const duDifference: number = directory.du * -1;
            const cuDifference: number = directory.cu_size * -1;
            await this.updateDuAndCuSize(path, duDifference, cuDifference);
        } catch (error) {
            console.log(
                'DirectoriesRepository.deleteSinglePathAndUpdateCuDu - Failed at findOneAndDelete',
                path,
                directory,
                error
            );
        }
    };

    public deleteDirectoriesAtPaths = async (paths: string[]) => {
        try {
            paths.forEach(async (path) => {
                await this.deleteSinglePathAndUpdateCuDu(path);
            });
        } catch (error) {
            console.log(
                'DirectoriesRepository.deleteDirectoriesAtPaths - Failed to delete',
                paths,
                error
            );
        }
    };

    /*
    Will delete existing fileChildren in the parent directory and insert the new fileChildren
    */
    public replaceFileChildren = async (
        fileChildren: FileData[],
        parentDirectoryInDb: Directory
    ) => {
        try {
            await this.collection.deleteMany({
                path: { $in: parentDirectoryInDb.fileChildren }
            });
        } catch (error) {
            console.log(
                'DirectoriesRepository.replaceFileChildren - Failed at deleteMany',
                parentDirectoryInDb,
                fileChildren,
                error
            );
        }

        const fileChildrenToDirectory: Directory[] = mapFileDataToDirectories(
            fileChildren,
            parentDirectoryInDb._id
        );

        await this.insertNewDirectoryList(fileChildrenToDirectory);
    };

    private sumDuAndCuOfChildren = async (
        path: string
    ): Promise<Document[]> => {
        try {
            return this.collection
                .aggregate([
                    { $match: { path } },
                    {
                        $lookup: {
                            from: COLLECTION,
                            localField: 'directoryChildren',
                            foreignField: 'path',
                            as: 'children_docs'
                        }
                    },

                    { $unwind: '$children_docs' },

                    {
                        $group: {
                            _id: null,
                            du: { $sum: '$children_docs.du' },
                            cu_size: { $sum: '$children_docs.cu_size' }
                        }
                    }
                ])
                .toArray();
        } catch (error) {
            console.log(
                'DirectoriesRepository.sumDuAndCuOfChildren - Failed at aggregation',
                path,
                error
            );
        }
    };

    public findDirectoryAtPath = async (path: string): Promise<Directory> => {
        try {
            const directory: Directory = await this.collection.findOne({
                path
            });

            if (!directory) {
                console.log(
                    `DirectoriesRepository.findDirectoryAtPath - Directory not found at path ${path}`
                );
                // TODO Send message to daemon to republish
                return;
            }
            return directory;
        } catch (error) {
            console.log(
                'DirectoriesRepository.findDirectoryAtPath - Failed to findOne',
                path,
                error
            );
        }
    };

    public getIdOfParent = async (path: string) => {
        const pathOneLevelUp: string = dirname(path);
        try {
            const parent: Directory = await this.collection.findOne({
                path: pathOneLevelUp
            });
            console.log(
                `DirectoriesRepository.getIdOfParent - ParentId of path: ${path} is: ${parent._id}`
            );
            return parent ? parent._id : null;
        } catch (error) {
            console.log(
                'DirectoriesRepository.getIdOfParent - Failed to findOne',
                path,
                error
            );
        }
    };

    /*
     Will upsert the directory document with the new fields and updated fileChildren and DirectoryChildren arrays.
    */
    public updateDirectoryForIncrementalScan = async (
        fileChildren: FileData[],
        directoryChildren: DaemonFullScanEvent[],
        directory: FileData
    ): Promise<UpdateDirectoryForIncrementalScanResult> => {
        const parentDirectoryInDb: Directory = await this.findDirectoryAtPath(
            directory.path
        );

        if (!parentDirectoryInDb) {
            console.log(
                'DirectoriesRepository.updateDirectoryForIncrementalScan - the parent directory does not exist. Will Upsert Instead',
                directory,
                fileChildren,
                directoryChildren
            );
        }

        let childrenDuSize: number = 0;
        let childrenCuSize: number = 0;
        if (parentDirectoryInDb) {
            const result: Document[] = await this.sumDuAndCuOfChildren(
                directory.path
            );

            childrenDuSize = result.length > 0 ? result[0].du : 0;
            childrenCuSize = result.length > 0 ? result[0].cu_size : 0;
        }
        const now: Date = new Date();

        const fileChildrenPaths: string[] = fileChildren.map(
            (file) => file.path
        );
        const directoryChildrenPaths: string[] = directoryChildren.map(
            (directory) => directory.data.path
        );

        const parentId: ObjectId = await this.getIdOfParent(directory.path);
        const id: ObjectId = new ObjectId();

        try {
            await this.collection.findOneAndUpdate(
                {
                    _id: parentDirectoryInDb ? parentDirectoryInDb._id : id
                },
                {
                    $set: {
                        parentId: parentId,
                        path: directory.path,
                        status: directory.status,
                        attrib: directory.attrib,
                        link: directory.link,
                        device: directory.device,
                        mounted: directory.mounted,
                        is_socket: directory.is_socket,
                        is_fifo: directory.is_fifo,
                        modifiedAt: directory.date_modified,
                        fileChildren: fileChildrenPaths,
                        du: directory.du, // TODO, double check this logic of set then inc right after. Does it do setValue + incValue
                        cu_size: directory.cu_size,
                        updatedAt: now
                    },
                    $inc: { du: childrenDuSize, cu_size: childrenCuSize }, // TODO double check this logic why inc size the existing childs
                    $push: {
                        directoryChildren: { $each: directoryChildrenPaths }
                    }
                },
                { upsert: true } // This should only upsert in the case of a unmount/mount
            );
        } catch (error) {
            console.log(
                'DirectoriesRepository.updateDirectoryForIncrementalScan - Failed at findOneAndUpdate',
                directory,
                parentDirectoryInDb,
                error
            );
        }
        return {
            parentDirectoryId: parentDirectoryInDb
                ? parentDirectoryInDb._id
                : id,
            parentDirectoryInDb
        };
    };

    public removeDirectoryInParentChildren = async (
        path: string
    ): Promise<Directory> => {
        const directory: Directory = await this.findDirectoryAtPath(path);
        if (!directory) {
            console.log(
                'DirectoriesRepository.removeDirectoryInParentChildren - Directory not found. It was likely deleted already, skipping'
            );
            return;
        }
        try {
            await this.collection.findOneAndUpdate(
                { _id: directory.parentId },
                {
                    $pull: { directoryChildren: path }
                }
            );

            return directory;
        } catch (error) {
            console.log(
                'DirectoriesRepository.removeDirectoryInParentChildren - Failed at findOneAndUpdate',
                directory,
                path,
                error
            );
        }
    };
}

export default DirectoriesRepository;
