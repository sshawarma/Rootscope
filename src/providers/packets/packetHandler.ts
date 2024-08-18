import MsgPack from '../../lib/msgpack';
import MongoDB from '../../mongo/mongo';
import EventHandler from '../eventHandler';
import { DaemonEvent, EventData, EventPacket } from '../types/daemonEvent';

class EventPacketHandler {
    private static _instance: EventPacketHandler;

    private mongo: MongoDB;

    private msgPack: MsgPack;

    private eventHandler: EventHandler;

    private constructor() {
        this.mongo = MongoDB.getInstance();
        this.msgPack = MsgPack.getInstance();
        this.eventHandler = EventHandler.getInstance();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new EventPacketHandler();
        return this._instance;
    }

    public process = async (eventPacket: EventPacket) => {
        await this.mongo.insertEventPacket(eventPacket);
        const packets: EventPacket[] = await this.mongo.queryEventPackets(
            eventPacket.message_id
        );
        if (packets.length == eventPacket.total_packets) {
            const unpackedEventData: EventData =
                this.msgPack.orderAndUnpackEventPackets(packets);
            console.log(unpackedEventData);
            const daemonEvent: DaemonEvent = {
                event_type: eventPacket.event_type,
                event_data: unpackedEventData
            };

            console.log(daemonEvent);

            this.eventHandler.process(daemonEvent);
        }
    };
}

export default EventPacketHandler;
