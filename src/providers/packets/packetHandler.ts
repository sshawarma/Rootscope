import MsgPack from '../../lib/msgpack';
import EventPacketRepository from '../../mongo/eventPacketRepository';
import EventHandler from '../eventHandler';
import { DaemonEvent, EventData, EventPacket } from '../types/daemonEvent';

class EventPacketHandler {
    private static _instance: EventPacketHandler;

    private eventPacketRepository: EventPacketRepository;

    private eventHandler: EventHandler;

    private constructor() {
        this.eventPacketRepository = EventPacketRepository.getInstance();
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
                MsgPack.orderAndUnpackEventPackets(packets);
            const daemonEvent: DaemonEvent = {
                event_type: eventPacket.event_type,
                event_data: unpackedEventData
            };

            await this.eventHandler.process(daemonEvent);
        }
    };
}

export default EventPacketHandler;
