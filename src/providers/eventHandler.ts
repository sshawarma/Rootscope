import { ObjectId } from 'mongodb';
import { DaemonEvent } from './types/daemonEvent';
import FullScanEventProvider from './daemonFullScanEventProvider';
import MongoDB from '../mongo/mongo';
import {
    isDaemonFileSystemChangeEvent,
    isDaemonFullScanEvent,
    isDaemonStatusEvent
} from './types/typeGuards';
import HardwareEventProvider from './daemonHardwareEventProvider';
import FileSystemChangeEventProvider from './changeEvents/filesystemChangeEventProvider';
import { EventType } from './types/fileSystemChangeEvent';
import DaemonStatusEventProvider from './daemonStatusEventProvider';

class EventHandler {
    private static _instance: EventHandler;

    private fullScanEventProvider: FullScanEventProvider;

    private hardwareEventProvider: HardwareEventProvider;

    private fileSystemChangeEventProvider: FileSystemChangeEventProvider;

    private daemonStatusEventProvider: DaemonStatusEventProvider;

    private constructor() {
        this.fullScanEventProvider = FullScanEventProvider.getInstance();
        this.hardwareEventProvider = HardwareEventProvider.getInstance();
        this.fileSystemChangeEventProvider =
            FileSystemChangeEventProvider.getInstance();
    }

    public getEventProcessor(eventType: EventType): (event: any) => void {
        return (
            this.eventProcessors[eventType] ||
            this.eventProcessors[EventType.Unknown]
        );
    }

    private processUnknownEvent(event: DaemonEvent) {
        console.log(`Processing unknown event with event: ${event}`);
    }

    private processFullScanEvent(event: DaemonEvent) {
        console.log(`Processing full scan event`);
        const daemonEventData = event.event_data;
        if (isDaemonFullScanEvent(daemonEventData)) {
            this.fullScanEventProvider.process(daemonEventData);
        } else {
            console.log('ERROR:Not DaemonFullScanData');
        }
    }

    private processFilesystemChangeEvent(event: DaemonEvent) {
        console.log(
            `Processing filesystem change event with event: ${JSON.stringify(
                event
            )}`
        );
        const daemonEventData = event.event_data;
        if (isDaemonFileSystemChangeEvent(daemonEventData)) {
            this.fileSystemChangeEventProvider.process(daemonEventData);
        } else {
            console.log('ERROR:Not DaemonFileSystemChangeEvent');
        }
    }

    private processNetworkChangeEvent(event: DaemonEvent) {
        console.log(
            `Processing network change event with event: ${JSON.stringify(
                event
            )}`
        );
    }

    private processHardwareChangeEvent(event: DaemonEvent) {
        console.log(
            `Processing hardware change event with event: ${JSON.stringify(
                event
            )}`
        );
    }

    private processDaemonStatusEvent = (event: DaemonEvent) => {
        console.log('Processing daemon status event');
        const daemonEventData = event.event_data;
        if (isDaemonStatusEvent(daemonEventData)) {
            this.daemonStatusEventProvider.process(daemonEventData);
        }
    };

    private eventProcessors: Record<EventType, (event: DaemonEvent) => void> = {
        [EventType.Unknown]: this.processUnknownEvent.bind(this),
        [EventType.FullScan]: this.processFullScanEvent.bind(this),
        [EventType.FilesystemChange]:
            this.processFilesystemChangeEvent.bind(this),
        [EventType.NetworkChange]: this.processNetworkChangeEvent.bind(this),
        [EventType.HardwareChange]: this.processHardwareChangeEvent.bind(this),
        [EventType.DaemonStatus]: this.processDaemonStatusEvent.bind(this)
    };

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }
        this._instance = new EventHandler();
        return this._instance;
    }

    public process = (event: DaemonEvent): any => {
        const processor =
            this.eventProcessors[event.event_type] ||
            this.eventProcessors[EventType.Unknown];
        processor(event);
    };
}

// record<event_type, () => void>

export default EventHandler;
