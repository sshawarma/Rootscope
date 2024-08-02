import { ObjectId } from 'mongodb';
import MongoDB from '../mongo/mongo';
import { Directory } from '../mongo/types/schema';
import { DaemonFullScanEvent } from './types/fullScanEvent';

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

    public transformTree = (inputData: DaemonFullScanEvent): Directory[] => {
        const idToNode: { [key: string]: DaemonFullScanEvent } = {};
        const Directorys: Directory[] = [];

        const assignIds = (node: DaemonFullScanEvent): ObjectId => {
            const nodeId = new ObjectId();
            node.data._id = nodeId;
            idToNode[nodeId.toHexString()] = node;

            const childrenIds = node.children.map(assignIds);
            const now: Date = new Date();
            Directorys.push({
                ...node.data,
                _id: nodeId,
                children: childrenIds,
                createdAt: now,
                updatedAt: now
            });

            return nodeId;
        };

        assignIds(inputData);
        return Directorys;
    };

    public process = async (event: DaemonFullScanEvent): Promise<void> => {
        const transformedDirectory: Directory[] = this.transformTree(event);
        // await this.mongo.insertNewDirectoryList(transformedDirectory)
    };
}

export default FullScanEventProvider;
