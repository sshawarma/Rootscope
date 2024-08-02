import { pack, unpack } from 'msgpackr';

import { DaemonEvent } from '../providers/types/daemonEvent';

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

    public packMessage = (valueToPack: any): Buffer => {
        return pack(valueToPack);
    };

    public unpackMessage = (valueToUnpack: Buffer): DaemonEvent => {
        let unpackedMessage: any;

        try {
            unpackedMessage = unpack(valueToUnpack);
        } catch (error) {
            console.log('Could not unpack message', error);
        }
        if (this.isDaemonEvent(unpackedMessage)) {
            return unpackedMessage;
        }
        console.log('Could not unpack message:', valueToUnpack);
    };

    private isDaemonEvent = (obj: any): obj is DaemonEvent => {
        return obj?.event_type && obj?.event_data;
    };
}

export default MsgPack;
