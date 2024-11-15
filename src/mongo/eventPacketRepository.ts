import { Collection, Db } from 'mongodb';

import MongoDB from './mongo';
import { EventPacket } from '../providers/types/daemonEvent';
import { MongoEventPacket } from './types/schema';

class EventPacketRepository {
    private static _instance: EventPacketRepository;
    private collection: Collection<MongoEventPacket>;
    private db: Db;

    private constructor() {
        try {
            const mongoDb: MongoDB = MongoDB.getInstance();

            this.db = mongoDb.db;

            this.collection = this.db.collection('eventPackets');
        } catch {
            console.log('Failed to establish mongo connection');
        }
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new EventPacketRepository();
        return this._instance;
    }

    public insertEventPacket = async (eventPacket: EventPacket) => {
        try {
            await this.collection.insertOne({
                ...eventPacket,
                createdAt: new Date()
            });
        } catch (error) {
            console.log(
                'EventPacketRepository.insertEventPacket - Failed to insertOne',
                eventPacket,
                error
            );
        }
    };

    public queryEventPackets = async (message_id: string) => {
        try {
            return this.collection.find({ message_id }).toArray();
        } catch (error) {
            console.log(
                'EventPacketRepository.queryEventPackets - Failed to find',
                message_id,
                error
            );
        }
    };
}

export default EventPacketRepository;
