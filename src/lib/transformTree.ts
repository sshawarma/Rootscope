import { ObjectId } from 'mongodb';
import { Directory } from '../mongo/types/schema';
import { DaemonFullScanEvent } from '../providers/types/fullScanEvent';

export const transformTree = (inputData: DaemonFullScanEvent): Directory[] => {
    const idToNode: { [key: string]: DaemonFullScanEvent } = {};
    const directories: Directory[] = [];

    const assignIds = (
        node: DaemonFullScanEvent,
        parentId?: ObjectId
    ): ObjectId => {
        const nodeId = new ObjectId();
        node.data._id = nodeId;
        node.data.parentId = parentId;
        idToNode[nodeId.toHexString()] = node;

        const childrenIds = node.children.map((event) =>
            assignIds(event, nodeId)
        );
        const now: Date = new Date();
        directories.push({
            ...node.data,
            _id: nodeId,
            children: childrenIds,
            createdAt: now,
            updatedAt: now,
            parentId
        });

        return nodeId;
    };

    assignIds(inputData);
    return directories;
};
