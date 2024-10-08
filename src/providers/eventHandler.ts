import { DaemonEvent, EventData } from './types/daemonEvent';
import FullScanEventProvider from './fullScanEventProvider';
import {
    isDaemonFileSystemChangeEvent,
    isDaemonFullScanEvent,
    isDaemonHardwareEvent,
    isDaemonStatusEvent,
    isIncrementalScanEvent
} from './types/typeGuards';
import HardwareEventProvider from './hardwareEventProvider';
import FileSystemChangeEventProvider from './changeEvents/filesystemChangeEventProvider';
import {
    EventType,
    FileSystemChangeEvent
} from './types/fileSystemChangeEvent';
import DaemonStatusEventProvider from './daemonStatusEventProvider';
import IncrementalScanEventProvider from './incrementalScanEventProvider';
import EventHistoryRepository from '../mongo/eventHistoryRepository';
import { EventHistory } from './types/eventHistory';

class EventHandler {
    private static _instance: EventHandler;

    private fullScanEventProvider: FullScanEventProvider;

    private hardwareEventProvider: HardwareEventProvider;

    private fileSystemChangeEventProvider: FileSystemChangeEventProvider;

    private daemonStatusEventProvider: DaemonStatusEventProvider;

    private incrementalScanEventProvider: IncrementalScanEventProvider;

    private eventHistoryRepository: EventHistoryRepository;

    private constructor() {
        this.fullScanEventProvider = FullScanEventProvider.getInstance();
        this.hardwareEventProvider = HardwareEventProvider.getInstance();
        this.fileSystemChangeEventProvider =
            FileSystemChangeEventProvider.getInstance();
        this.incrementalScanEventProvider =
            IncrementalScanEventProvider.getInstance();
        this.eventHistoryRepository = EventHistoryRepository.getInstance();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }
        this._instance = new EventHandler();
        return this._instance;
    }

    private recordEvent = (
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

        this.eventHistoryRepository.insertEventHistory(eventToRecord);
    };

    private recordFileSystemEvents = (
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

        this.eventHistoryRepository.insertEventHistories(eventsToRecord);
    };

    private processUnknownEvent = (event: DaemonEvent) => {
        console.log(`Processing unknown event with event: ${event}`);
    };

    private processFullScanEvent = (event: DaemonEvent) => {
        console.log(`Processing full scan event`);
        const daemonEventData = event.event_data;
        if (isDaemonFullScanEvent(daemonEventData)) {
            this.fullScanEventProvider.process(daemonEventData);
            this.recordEvent(
                daemonEventData.event_id,
                EventType.FullScan,
                new Date(daemonEventData.data.date_created)
            );
        } else {
            console.log(
                'EventHandler.processFullScanEvent - Not DaemonFullScanData'
            );
        }
    };

    private processFilesystemChangeEvent = (event: DaemonEvent) => {
        console.log(
            `Processing filesystem change event with event: ${JSON.stringify(
                event
            )}`
        );
        const daemonEventData = event.event_data;
        if (isDaemonFileSystemChangeEvent(daemonEventData)) {
            this.fileSystemChangeEventProvider.process(daemonEventData);
            this.recordFileSystemEvents(daemonEventData.events);
        } else {
            console.log(
                'EventHandler.processFileSystemChangeEvent - Not FileSystemChangeEvent'
            );
        }
    };

    private processNetworkChangeEvent = (event: DaemonEvent) => {
        console.log(
            `Processing network change event with event: ${JSON.stringify(
                event
            )}`
        );
    };

    private processHardwareChangeEvent = (event: DaemonEvent) => {
        console.log(`Processing hardware change event with event`);
        const daemonEventData = event.event_data;
        if (isDaemonHardwareEvent(daemonEventData)) {
            this.hardwareEventProvider.process(daemonEventData);
            this.recordEvent(
                daemonEventData.event_id,
                EventType.FullScan,
                new Date(daemonEventData.created_at)
            );
        } else {
            console.log(
                'EventHandler.processHardwareChangeEvent - Not HardwareChangeEvent'
            );
        }
    };

    private processDaemonStatusEvent = (event: DaemonEvent) => {
        console.log('Processing daemon status event');
        const daemonEventData = event.event_data;
        if (isDaemonStatusEvent(daemonEventData)) {
            this.daemonStatusEventProvider.process(daemonEventData);
            this.recordEvent(
                daemonEventData.event_id,
                EventType.DaemonStatus,
                new Date(daemonEventData.created_at)
            );
        } else {
            console.log(
                'EventHandler.processDaemonStatusEvent - Not DaemonStatusEvent'
            );
        }
    };

    private processIncrementalScanEvent = (event: DaemonEvent) => {
        console.log('Processing incremental scan event');
        const daemonEventData = event.event_data;
        if (isIncrementalScanEvent(daemonEventData)) {
            this.incrementalScanEventProvider.process(daemonEventData);
            this.recordEvent(
                daemonEventData.event_id,
                EventType.FullScan,
                new Date() // TODO ADD INCREMENTAL SCAN CREATE TIME ONCE IT IS ADDED
            );
        } else {
            console.log(
                'EventHandler.processIncrementalScanEvent - Not IncrementalScanEvent'
            );
        }
    };

    private eventProcessors: Record<EventType, (event: DaemonEvent) => void> = {
        [EventType.Unknown]: this.processUnknownEvent.bind(this),
        [EventType.FullScan]: this.processFullScanEvent.bind(this),
        [EventType.FilesystemChange]:
            this.processFilesystemChangeEvent.bind(this),
        [EventType.NetworkChange]: this.processNetworkChangeEvent.bind(this),
        [EventType.HardwareChange]: this.processHardwareChangeEvent.bind(this),
        [EventType.DaemonStatus]: this.processDaemonStatusEvent.bind(this),
        [EventType.IncrementalScan]: this.processIncrementalScanEvent.bind(this)
    };

    public process = (event: DaemonEvent): any => {
        const processor =
            this.eventProcessors[event.event_type] ||
            this.eventProcessors[EventType.Unknown];
        processor(event);
    };
}

export default EventHandler;
