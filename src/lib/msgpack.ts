import { pack, unpack } from "msgpackr";

import { DaemonEvent, DaemonFullScanEvent, TransformedNode } from "../providers/types/eventTypes";

class MsgPack {
    private static _instance: MsgPack;

    private constructor() { }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new MsgPack();
        return this._instance;
    }

    public packMessage = (valueToPack: any): Buffer => {
        return pack(valueToPack)
    }

    public unpackMessage = (valueToUnpack: Buffer): DaemonEvent => {
        let unpackedMessage: any

        try {
        unpackedMessage = unpack(valueToUnpack)
    } catch (error) {
        console.log("Could not unpack message", error)
        }
        if (this.isDaemonEvent(unpackedMessage)) {
            return unpackedMessage
        }
        console.log("Could not unpack message:", valueToUnpack)
    }

    private isDaemonEvent = (obj: any): obj is DaemonEvent => {
        return obj?.event_type && obj?.event_data;
      };
}

export default MsgPack;

export const msg: DaemonFullScanEvent = {
    "data": {
        "path": "/home/martin/Documents/linux-visualizer/src/daemon",
        "status": "success",
        "type": "directory",
        "perm": "rwxrwxr-x",
        "date_created": 1720648810,
        "du": 20480,
        "cu_size": 13750,
        "link": null,
        "device": null,
        "mounted": null,
        "is_socket": 0,
        "is_fifo": 0
    },
    "children": [
        {
            "data": {
                "path": "/home/martin/Documents/linux-visualizer/src/daemon/daemon_lib.c",
                "status": "success",
                "type": "file",
                "perm": "rw-rw-r--",
                "date_created": 1720648810,
                "du": 4096,
                "cu_size": 2039,
                "link": null,
                "device": null,
                "mounted": null,
                "is_socket": 0,
                "is_fifo": 0
            },
            "children": []
        },
        {
            "data": {
                "path": "/home/martin/Documents/linux-visualizer/src/daemon/include",
                "status": "success",
                "type": "directory",
                "perm": "rwxrwxr-x",
                "date_created": 1720648810,
                "du": 8192,
                "cu_size": 5459,
                "link": null,
                "device": null,
                "mounted": null,
                "is_socket": 0,
                "is_fifo": 0
            },
            "children": [
                {
                    "data": {
                        "path": "/home/martin/Documents/linux-visualizer/src/daemon/include/daemon.h",
                        "status": "success",
                        "type": "file",
                        "perm": "rw-rw-r--",
                        "date_created": 1720648810,
                        "du": 4096,
                        "cu_size": 1363,
                        "link": null,
                        "device": null,
                        "mounted": null,
                        "is_socket": 0,
                        "is_fifo": 0
                    },
                    "children": []
                }
            ]
        },
        {
            "data": {
                "path": "/home/martin/Documents/linux-visualizer/src/daemon/daemon.c",
                "status": "success",
                "type": "file",
                "perm": "rw-rw-r--",
                "date_created": 1720648810,
                "du": 4096,
                "cu_size": 3519,
                "link": null,
                "device": null,
                "mounted": null,
                "is_socket": 0,
                "is_fifo": 0
            },
            "children": []
        }
    ]
    }