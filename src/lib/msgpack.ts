import { pack, unpack } from 'msgpackr';

import { EventData, EventPacket } from '../providers/types/daemonEvent';

class MsgPack {
    private static _instance: MsgPack;

    private constructor() {}

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new MsgPack();
        return this._instance;
    }

    public static packMessage = (valueToPack: any): Buffer => {
        return pack(valueToPack);
    };

    public static unpackMessage = (valueToUnpack: Buffer): EventData => {
        try {
            return unpack(valueToUnpack);
        } catch (error) {
            console.log('Could not unpack message', error);
        }
    };

    public static orderAndUnpackEventPackets = (
        eventPackets: EventPacket[]
    ): EventData => {
        const packedData: string = eventPackets
            .sort((a, b) => (a.sequence_number > b.sequence_number ? 1 : -1))
            .map((packet) => packet.packed_data)
            .join('');
        const bufferData: Buffer = Buffer.from(packedData, 'base64');
        return this.unpackMessage(bufferData);
    };
}

export default MsgPack;
