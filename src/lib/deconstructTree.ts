import { ObjectId } from 'mongodb';
import { DaemonFullScanEvent, TransformedNode } from '../providers/types/eventTypes';

 export const transformTree = (inputData: DaemonFullScanEvent): TransformedNode[] => {
    const idToNode: { [key: string]: DaemonFullScanEvent } = {};
    const transformedNodes: TransformedNode[] = [];

    const assignIds = (node: DaemonFullScanEvent): ObjectId => {
        const nodeId = new ObjectId();
        node.data._id = nodeId;
        idToNode[nodeId.toHexString()] = node;

        const childrenIds = node.children.map(assignIds);
        const now: Date = new Date()
        transformedNodes.push({
            ...node.data,
            _id: nodeId,
            children: childrenIds,
            createdAt: now,
            updatedAt: now
        });

        return nodeId;
    }

    assignIds(inputData);
    return transformedNodes;
}