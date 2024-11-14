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
    isDaemonFullScanEventData,
    isDaemonHardwareEvent,
    isDaemonStatusEvent,
    isIncrementalScanEvent,
    isVolatileEvent
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
        this.daemonStatusEventProvider =
            DaemonStatusEventProvider.getInstance();
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
                lastSuccesfulEventTime: parseInt((new Date().getTime() / 1000).toFixed(0)),
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
        if (isDaemonFullScanEventData(daemonEventData)) {
            const isPreviousEvent = await this.checkForPreviousEvent(
                daemonEventData.event_id,
                EventType.FULL_SCAN
            );
            if (!isPreviousEvent) {
                return;
            }
            await this.fullScanEventProvider.process(daemonEventData.data);
            await this.eventHistoryProvider.recordEvent(
                daemonEventData.event_id,
                EventType.FULL_SCAN,
                new Date(daemonEventData.data.data.date_created),
                {}
            );
        } else {
            console.log(
                'EventHandler.processFullScanEvent - Not DaemonFullScanData'
            );
        }
    };

    private processFilesystemChangeEvent = async (event: DaemonEvent) => {
        console.log(`Processing filesystem change event`);
        const daemonEventData = event.event_data;
        if (isDaemonFileSystemChangeEvent(daemonEventData)) {
            const isPreviousEvent = await this.checkForPreviousEvent(
                daemonEventData.events[0].event_id,
                EventType.FILESYSTEM_CHANGE
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
        console.log(`Processing hardware change event`);
        const daemonEventData = event.event_data;
        if (isDaemonHardwareEvent(daemonEventData)) {
            const isPreviousEvent = await this.checkForPreviousEvent(
                daemonEventData.event_id,
                EventType.HARDWARE_CHANGE
            );
            if (!isPreviousEvent) return;
            await this.hardwareEventProvider.process(daemonEventData);
            await this.eventHistoryProvider.recordEvent(
                daemonEventData.event_id,
                EventType.HARDWARE_CHANGE,
                new Date(daemonEventData.created_at),
                { device: daemonEventData.device }
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
                EventType.DAEMON_STATUS
            );
            if (!isPreviousEvent) return;
            await this.daemonStatusEventProvider.process(daemonEventData);
            await this.eventHistoryProvider.recordEvent(
                daemonEventData.event_id,
                EventType.DAEMON_STATUS,
                new Date(daemonEventData.created_at),
                {
                    status: daemonEventData.status,
                    reason: daemonEventData.reason
                }
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
            // Don't check for previous event since this event is meant to override state
            await this.incrementalScanEventProvider.process(daemonEventData);
            await this.eventHistoryProvider.recordEvent(
                daemonEventData.event_id,
                EventType.INCREMENTAL_SCAN,
                new Date(daemonEventData.created_at),
                {}
            );
        } else {
            console.log(
                'EventHandler.processIncrementalScanEvent - Not IncrementalScanEvent'
            );
        }
    };

    private processVolatileEvent = async (event: DaemonEvent) => {
        console.log(`Processing volatile event`);
        const daemonEventData = event.event_data;
        if (isVolatileEvent(daemonEventData)) {
            const isPreviousEvent = await this.checkForPreviousEvent(
                daemonEventData.event_id,
                EventType.VOLATILE_EVENT
            );
            if (!isPreviousEvent) return;
            await this.fileSystemChangeEventProvider.processVolatileEvent(
                daemonEventData
            );
            await this.eventHistoryProvider.recordEvent(
                daemonEventData.event_id,
                EventType.VOLATILE_EVENT,
                new Date(daemonEventData.created_at),
                { responsibleProcess: daemonEventData.responsible_process }
            );
        } else {
            console.log(
                'EventHandler.processVolatileEvent - Not VolatileEvent'
            );
        }
    };

    private eventProcessors: Record<
        EventType,
        (event: DaemonEvent) => Promise<void>
    > = {
        [EventType.UNKNOWN]: this.processUnknownEvent.bind(this),
        [EventType.FULL_SCAN]: this.processFullScanEvent.bind(this),
        [EventType.FILESYSTEM_CHANGE]:
            this.processFilesystemChangeEvent.bind(this),
        [EventType.NETWORK_CHANGE]: this.processNetworkChangeEvent.bind(this),
        [EventType.HARDWARE_CHANGE]: this.processHardwareChangeEvent.bind(this),
        [EventType.DAEMON_STATUS]: this.processDaemonStatusEvent.bind(this),
        [EventType.INCREMENTAL_SCAN]:
            this.processIncrementalScanEvent.bind(this),
        [EventType.VOLATILE_EVENT]: this.processVolatileEvent.bind(this)
    };

    public process = async (event: DaemonEvent) => {
        const processor =
            this.eventProcessors[event.event_type] ||
            this.eventProcessors[EventType.UNKNOWN];
        await processor(event);
    };
}

export default EventHandler;
