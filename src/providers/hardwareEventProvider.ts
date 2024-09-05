import DaemonHardwareEventRepository from '../mongo/daemonHardwareEventRepository';
import { DaemonHardwareEvent } from './types/hardwareEvent';

class HardwareEventProvider {
    private static _instance: HardwareEventProvider;

    private daemonHardwareEventRepository: DaemonHardwareEventRepository;

    private constructor() {
        this.daemonHardwareEventRepository =
            DaemonHardwareEventRepository.getInstance();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new HardwareEventProvider();
        return this._instance;
    }

    public process = (event: DaemonHardwareEvent): void => {
        this.daemonHardwareEventRepository.insertHardwareEvent(event);
    };
}

export default HardwareEventProvider;
