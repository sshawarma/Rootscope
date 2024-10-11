import EventHistoryRepository from '../mongo/eventHistoryRepository';
import { EventHistory } from './types/eventHistory';
import {
    EventType,
    FileSystemChangeEvent
} from './types/fileSystemChangeEvent';

class EventHistoryProvider {
    private static _instance: EventHistoryProvider;

    private eventHistoryRepository: EventHistoryRepository;

    private constructor() {
        this.eventHistoryRepository = EventHistoryRepository.getInstance();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new EventHistoryProvider();
        return this._instance;
    }

    public recordEvent = async (
        eventId: number,
        eventType: EventType,
        timeOfEvent: Date
    ) => {
        const eventToRecord: EventHistory = {
            eventId,
            eventType,
            processedAt: new Date(),
            timeOfEvent: timeOfEvent
        };

        await this.eventHistoryRepository.insertEventHistory(eventToRecord);
    };

    public recordFileSystemEvents = async (
        fileSystemChangeEvents: FileSystemChangeEvent[]
    ) => {
        const now: Date = new Date();
        const eventsToRecord: EventHistory[] = fileSystemChangeEvents.map(
            (fsChangeEvent) => ({
                eventId: fsChangeEvent.event_id,
                processedAt: now,
                eventType: EventType.FilesystemChange,
                timeOfEvent: new Date(fsChangeEvent.created_at)
            })
        );

        await this.eventHistoryRepository.insertEventHistories(eventsToRecord);
    };

    public isEventBefore = async (eventId: number): Promise<Boolean> => {
        const eventHistory = await this.eventHistoryRepository.findEventBefore(
            eventId
        );
        return !!eventHistory;
    };
}

export default EventHistoryProvider;
