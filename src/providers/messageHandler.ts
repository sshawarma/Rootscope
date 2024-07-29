import { ObjectId } from 'mongodb';
import {
    DaemonEvent,
    DaemonFullScanEvent,
    DaemonHardwareEvent,
    EventType,
    TransformedNode
} from './types/eventTypes';
import FullScanEventProvider from './fullScanEventProvider';
import HardwareEventProvider from './hardwareEventProvider';
import MongoDB from '../lib/mongo';
import { isDaemonFullScanEvent } from './types/typeGuards';

interface Eventeventuments {
    [EventType.Unknown]: any;
    [EventType.FullScan]: DaemonFullScanEvent;
    [EventType.FilesystemChange]: { path: string; changed: boolean };
    [EventType.NetworkChange]: { status: string };
    [EventType.HardwareChange]: DaemonHardwareEvent;
}

class EventHandler {
    private static _instance: EventHandler;

    private fullScanEventProvider: FullScanEventProvider;

    private hardwareEventProvider: HardwareEventProvider;

    // private mongo: MongoDB;

    // private eventProcessors: Record<EventType, () => void>;

    private constructor() {
        this.fullScanEventProvider = FullScanEventProvider.getInstance();
        this.hardwareEventProvider = HardwareEventProvider.getInstance();
        // this.mongo = MongoDB.getInstance();
        // this.eventProcessors = {
        //     [EventType.Unknown]: () => console.log('unknown event oh no'),
        //     [EventType.FullScan]: this.fullScanEventProvider.process.bind(this.fullScanEventProvider),
        //     [EventType.FilesystemChange]: () => console.log('implement later'),
        //     [EventType.NetworkChange]: () => console.log('implement later'),
        //     [EventType.HardwareChange]: this.hardwareEventProvider.process.bind(this.hardwareEventProvider),
        //   };
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

    private eventProcessors: Record<EventType, (event: DaemonEvent) => void> = {
        [EventType.Unknown]: this.processUnknownEvent.bind(this),
        [EventType.FullScan]: this.processFullScanEvent.bind(this),
        [EventType.FilesystemChange]:
            this.processFilesystemChangeEvent.bind(this),
        [EventType.NetworkChange]: this.processNetworkChangeEvent.bind(this),
        [EventType.HardwareChange]: this.processHardwareChangeEvent.bind(this)
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
        // this.fullScanEventProvider.process(
        //     event.event_data as DaemonFullScanEvent
        // );
        processor(event);
    };
}

// record<event_type, () => void>

export default EventHandler;
