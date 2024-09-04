import { Directory } from '../mongo/types/schema';
import { DaemonFullScanEvent } from './types/fullScanEvent';
import { transformTree } from '../lib/transformTree';
import DirectoriesRepository from '../mongo/directoriesRepository';

class FullScanEventProvider {
    private static _instance: FullScanEventProvider;

    private directoriesRepository: DirectoriesRepository;

    private constructor() {
        this.directoriesRepository = DirectoriesRepository.getInstance();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new FullScanEventProvider();
        return this._instance;
    }

    public process = async (event: DaemonFullScanEvent): Promise<void> => {
        const transformedDirectory: Directory[] = transformTree(event);
        await this.directoriesRepository.insertNewDirectoryList(
            transformedDirectory
        );
    };
}

export default FullScanEventProvider;
