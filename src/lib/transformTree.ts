import { ObjectId } from 'mongodb';
import { Directory } from '../mongo/types/schema';
import {
    DaemonFullScanEvent,
    FileData,
    FileDataType
} from '../providers/types/fullScanEvent';

export const transformTree = (inputData: DaemonFullScanEvent): Directory[] => {
    const directories: Directory[] = [];

    const assignIds = (
        node: DaemonFullScanEvent,
        parentId?: ObjectId
    ): string => {
        const nodeId = new ObjectId();
        node.data._id = nodeId;
        node.data.parentId = parentId;

        const fileChildrenPaths = node.children
            .filter((event) => !isDirectory(event.data.type))
            .map((event) => assignIds(event));

        const directoryChildrenPaths = node.children
            .filter((event) => isDirectory(event.data.type))
            .map((event) => assignIds(event, nodeId));
        const now: Date = new Date();
        directories.push({
            ...node.data,
            _id: nodeId,
            du: node.data.du,
            isDir: isDirectory(node.data.type),
            fileChildren: fileChildrenPaths,
            directoryChildren: directoryChildrenPaths,
            createdAt: now,
            updatedAt: now,
            parentId
        });

        return node.data.path;
    };

    assignIds(inputData);
    return directories;
};

export const isDirectory = (bitmask: number): boolean => {
    return (
        !!(bitmask & (1 << 1)) ||
        !!(bitmask & (1 << 2)) ||
        !!(bitmask & (1 << 8))
    );
};

export const mapFileDataToDirectories = (
    fileData: FileData[],
    parentId: ObjectId
): Directory[] => {
    const now: Date = new Date();
    return fileData.map((file) => ({
        ...file,
        parentId: parentId,
        du: file.du,
        isDir: isDirectory(file.type),
        createdAt: now,
        updatedAt: now,
        fileChildren: [],
        directoryChildren: []
    }));
};
