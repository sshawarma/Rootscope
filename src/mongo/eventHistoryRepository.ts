import { Collection, Db } from 'mongodb';
import MongoDB from './mongo';
import { EventHistory } from './types/schema';

class EventHistoryRepository {
    private static _instance: EventHistoryRepository;
    private collection: Collection<EventHistory>;
    private db: Db;

    private constructor() {
        try {
            const mongoDb: MongoDB = MongoDB.getInstance();

            this.db = mongoDb.db;

            this.collection = this.db.collection('eventHistory');
        } catch {
            console.log('Failed to establish mongo connection');
        }
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new EventHistoryRepository();
        return this._instance;
    }

    public insertEventHistory = async (eventHistory: EventHistory) => {
        try {
            await this.collection.insertOne(eventHistory);
        } catch (error) {
            console.log(
                'EventHistoryRepository.insertEventHistory - Failed to insertOne',
                eventHistory,
                error
            );
        }
    };

    public insertEventHistories = async (eventHistories: EventHistory[]) => {
        try {
            await this.collection.insertMany(eventHistories);
        } catch (error) {
            console.log(
                'EventHistoryRepository.insertEventHistories - Failed to insertMany',
                eventHistories,
                error
            );
        }
    };

    public findEventBefore = async (eventId: number) => {
        try {
            const decrementedEventId = eventId - 1;
            return this.collection.findOne({ event_id: decrementedEventId });
        } catch (error) {
            console.log(
                'DaemonStatusEventRepository.findEventBefore - Failed to findOne',
                eventId,
                error
            );
        }
    };
}

export default EventHistoryRepository;
