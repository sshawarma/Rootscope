import MsgPack from '../../lib/msgpack';
import EventPacketRepository from '../../mongo/eventPacketRepository';
import MongoDB from '../../mongo/mongo';
import EventHandler from '../eventHandler';
import { DaemonEvent, EventData, EventPacket } from '../types/daemonEvent';

class EventPacketHandler {
    private static _instance: EventPacketHandler;

    private eventPacketRepository: EventPacketRepository;

    private msgPack: MsgPack;

    private eventHandler: EventHandler;

    private constructor() {
        this.eventPacketRepository = EventPacketRepository.getInstance();
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
        await this.eventPacketRepository.insertEventPacket(eventPacket);
        const packets: EventPacket[] =
            await this.eventPacketRepository.queryEventPackets(
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
