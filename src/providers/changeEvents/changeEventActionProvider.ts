import { transformTree } from '../../lib/transformTree';
import DirectoriesRepository from '../../mongo/directoriesRepository';
import { Directory } from '../../mongo/types/schema';
import { FileSystemChangeEvent } from '../types/fileSystemChangeEvent';

class ChangeEventActionProvider {
    private static _instance: ChangeEventActionProvider;

    private directoriesRepository: DirectoriesRepository;

    private constructor() {
        this.directoriesRepository = DirectoriesRepository.getInstance();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new ChangeEventActionProvider();
        return this._instance;
    }

    public handleAttrib = async (
        event: FileSystemChangeEvent
    ): Promise<void> => {
        if (!event?.new_data?.data?.attrib) {
            console.log('No attributes field for event:', event);
            return;
        }
        const updateResult: Boolean =
            await this.directoriesRepository.updateAttributes(
                event.location,
                event.new_data.data.attrib
            );
        if (!updateResult) {
            console.log(
                'Attribute did not get updated at path: ',
                event.location
            );
        }
    };

    public handleModify = async (
        event: FileSystemChangeEvent
    ): Promise<void> => {
        await this.directoriesRepository.updateDirectoryData(
            event.location,
            event.new_data.data
        );
    };

    public handleCloseWrite = async (
        event: FileSystemChangeEvent
    ): Promise<void> => {
        await this.directoriesRepository.updateModifiedAt(event.location);
    };

    public handleDelete = async (
        event: FileSystemChangeEvent
    ): Promise<void> => {
        await this.directoriesRepository.deleteDirectoryAndChildren(
            event.location
        );
    };

    public handleCreate = async (
        event: FileSystemChangeEvent
    ): Promise<void> => {
        const transformedDirectories: Directory[] = transformTree(
            event.new_data
        );
        this.directoriesRepository.createDirectoriesAndUpdateSizes(
            transformedDirectories,
            event.location
        );
    };
}

export default ChangeEventActionProvider;
