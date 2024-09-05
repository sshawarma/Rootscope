import { ObjectId } from 'mongodb';
import { Directory } from '../mongo/types/schema';
import { DaemonFullScanEvent } from '../providers/types/fullScanEvent';

export const transformTree = (inputData: DaemonFullScanEvent): Directory[] => {
    const directories: Directory[] = [];

    const assignIds = (
        node: DaemonFullScanEvent,
        parentId?: ObjectId
    ): string => {
        const nodeId = new ObjectId();
        node.data._id = nodeId;
        node.data.parentId = parentId;

        const childrenPaths = node.children.map((event) =>
            assignIds(event, nodeId)
        );
        const now: Date = new Date();
        directories.push({
            ...node.data,
            _id: nodeId,
            children: childrenPaths,
            createdAt: now,
            updatedAt: now,
            parentId
        });

        return node.data.path;
    };

    assignIds(inputData);
    return directories;
};
