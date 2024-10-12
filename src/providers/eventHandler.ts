import MQTTClientProvider from '../lib/mqttClientProvider';
import FileSystemChangeEventProvider from './changeEvents/filesystemChangeEventProvider';
import DaemonStatusEventProvider from './daemonStatusEventProvider';
import EventHistoryProvider from './eventHistoryProvider';
import FullScanEventProvider from './fullScanEventProvider';
import HardwareEventProvider from './hardwareEventProvider';
import IncrementalScanEventProvider from './incrementalScanEventProvider';
import { DaemonEvent } from './types/daemonEvent';
import { ErrorMessage, ErrorType } from './types/errors';
import { EventType } from './types/fileSystemChangeEvent';
import {
    isDaemonFileSystemChangeEvent,
    isDaemonFullScanEvent,
    isDaemonHardwareEvent,
    isDaemonStatusEvent,
    isIncrementalScanEvent
} from './types/typeGuards';

class EventHandler {
    private static _instance: EventHandler;

    private fullScanEventProvider: FullScanEventProvider;

    private hardwareEventProvider: HardwareEventProvider;

    private fileSystemChangeEventProvider: FileSystemChangeEventProvider;

    private daemonStatusEventProvider: DaemonStatusEventProvider;

    private incrementalScanEventProvider: IncrementalScanEventProvider;

    private eventHistoryProvider: EventHistoryProvider;

    private constructor() {
        this.fullScanEventProvider = FullScanEventProvider.getInstance();
        this.hardwareEventProvider = HardwareEventProvider.getInstance();
        this.fileSystemChangeEventProvider =
            FileSystemChangeEventProvider.getInstance();
        this.incrementalScanEventProvider =
            IncrementalScanEventProvider.getInstance();
        this.eventHistoryProvider = EventHistoryProvider.getInstance();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }
        this._instance = new EventHandler();
        return this._instance;
    }

    private checkForPreviousEvent = async (
        eventId: number,
        eventType: EventType
    ) => {
        const isEventBefore: Boolean =
            await this.eventHistoryProvider.isEventBefore(eventId);

        if (!isEventBefore) {
            const messageToPublish: ErrorMessage = {
                errorType: ErrorType.OUT_OF_ORDER,
                eventType: eventType,
                timeOfError: new Date(),
                data: { eventId }
            };
            MQTTClientProvider.publishToTopic(JSON.stringify(messageToPublish));
            return false;
        }
        return true;
    };

    private processUnknownEvent = (event: DaemonEvent) => {
        console.log(`Processing unknown event with event: ${event}`);
    };

    private processFullScanEvent = async (event: DaemonEvent) => {
        console.log(`Processing full scan event`);
        const daemonEventData = event.event_data;
        if (isDaemonFullScanEvent(daemonEventData)) {
            const isPreviousEvent = await this.checkForPreviousEvent(
                daemonEventData.event_id,
                EventType.FullScan
            );
            if (!isPreviousEvent) {
                return;
            }
            await this.fullScanEventProvider.process(daemonEventData);
            await this.eventHistoryProvider.recordEvent(
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

    private processFilesystemChangeEvent = async (event: DaemonEvent) => {
        console.log(
            `Processing filesystem change event with event: ${JSON.stringify(
                event
            )}`
        );
        const daemonEventData = event.event_data;
        if (isDaemonFileSystemChangeEvent(daemonEventData)) {
            const isPreviousEvent = await this.checkForPreviousEvent(
                daemonEventData[0].event_id,
                EventType.FilesystemChange
            );
            if (!isPreviousEvent) return;
            await this.fileSystemChangeEventProvider.process(daemonEventData);
            await this.eventHistoryProvider.recordFileSystemEvents(
                daemonEventData.events
            );
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

    private processHardwareChangeEvent = async (event: DaemonEvent) => {
        console.log(`Processing hardware change event with event`);
        const daemonEventData = event.event_data;
        if (isDaemonHardwareEvent(daemonEventData)) {
            const isPreviousEvent = await this.checkForPreviousEvent(
                daemonEventData.event_id,
                EventType.HardwareChange
            );
            if (!isPreviousEvent) return;
            await this.hardwareEventProvider.process(daemonEventData);
            await this.eventHistoryProvider.recordEvent(
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

    private processDaemonStatusEvent = async (event: DaemonEvent) => {
        console.log('Processing daemon status event');
        const daemonEventData = event.event_data;
        if (isDaemonStatusEvent(daemonEventData)) {
            const isPreviousEvent = await this.checkForPreviousEvent(
                daemonEventData.event_id,
                EventType.DaemonStatus
            );
            if (!isPreviousEvent) return;
            await this.daemonStatusEventProvider.process(daemonEventData);
            await this.eventHistoryProvider.recordEvent(
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

    private processIncrementalScanEvent = async (event: DaemonEvent) => {
        console.log('Processing incremental scan event');
        const daemonEventData = event.event_data;
        if (isIncrementalScanEvent(daemonEventData)) {
            const isPreviousEvent = await this.checkForPreviousEvent(
                daemonEventData.event_id,
                EventType.IncrementalScan
            );
            if (!isPreviousEvent) return;
            await this.incrementalScanEventProvider.process(daemonEventData);
            await this.eventHistoryProvider.recordEvent(
                daemonEventData.event_id,
                EventType.FullScan,
                new Date(daemonEventData.created_at)
            );
        } else {
            console.log(
                'EventHandler.processIncrementalScanEvent - Not IncrementalScanEvent'
            );
        }
    };

    private eventProcessors: Record<
        EventType,
        (event: DaemonEvent) => Promise<void>
    > = {
        [EventType.Unknown]: this.processUnknownEvent.bind(this),
        [EventType.FullScan]: this.processFullScanEvent.bind(this),
        [EventType.FilesystemChange]:
            this.processFilesystemChangeEvent.bind(this),
        [EventType.NetworkChange]: this.processNetworkChangeEvent.bind(this),
        [EventType.HardwareChange]: this.processHardwareChangeEvent.bind(this),
        [EventType.DaemonStatus]: this.processDaemonStatusEvent.bind(this),
        [EventType.IncrementalScan]: this.processIncrementalScanEvent.bind(this)
    };

    public process = async (event: DaemonEvent) => {
        const processor =
            this.eventProcessors[event.event_type] ||
            this.eventProcessors[EventType.Unknown];
        await processor(event);
    };
}

export default EventHandler;
