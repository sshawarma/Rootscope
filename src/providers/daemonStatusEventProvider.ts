import DaemonStatusEventRepository from '../mongo/daemonStatusEventRepository';
import { DaemonStatusEvent } from './types/daemonEvent';

class DaemonStatusEventProvider {
    private static _instance: DaemonStatusEventProvider;

    private daemonStatusEventRepository: DaemonStatusEventRepository;

    private constructor() {
        this.daemonStatusEventRepository =
            DaemonStatusEventRepository.getInstance();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new DaemonStatusEventProvider();
        return this._instance;
    }

    public process = async (event: DaemonStatusEvent): Promise<void> => {
        await this.daemonStatusEventRepository.insertDaemonStatusEvent(event);
    };
}

export default DaemonStatusEventProvider;
