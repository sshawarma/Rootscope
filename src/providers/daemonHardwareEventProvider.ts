import DaemonHardwareEventRepository from '../mongo/daemonHardwareEventRepository';
import { DaemonHardwareEvent } from './types/hardwareEvent';

class HardwareEventProvider {
    private static _instance: HardwareEventProvider;

    private DaemonHardwareEventRepository: DaemonHardwareEventRepository;

    private constructor() {
        this.DaemonHardwareEventRepository =
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
        this.DaemonHardwareEventRepository.insertHardwareEvent(event);
    };
}

export default HardwareEventProvider;
