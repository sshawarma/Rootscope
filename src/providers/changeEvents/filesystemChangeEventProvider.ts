import ChangeEventActionProvider from './changeEventActionProvider';
import {
    DaemonFileSystemChangeEvent,
    FileSystemChangeEvent
} from '../types/fileSystemChangeEvent';
import DaemonFileSystemChangeEventRepository from '../../mongo/daemonFileSystemChangeEventRepository';

export enum Action {
    Attrib = 'attrib',
    Access = 'access',
    Modify = 'modify',
    CloseWrite = 'close-write',
    CloseNowrite = 'close-nowrite',
    MovedFrom = 'moved_from',
    MovedTo = 'moved_to',
    Create = 'create',
    Delete = 'delete',
    DeleteSelf = 'delete-self',
    Rename = 'rename',
    SubDirectory = 'sub-directory',
    Unknown = 'unknown'
}

class FileSystemChangeEventProvider {
    private static _instance: FileSystemChangeEventProvider;

    private changeEventActionProvider: ChangeEventActionProvider;

    private fileSystemChangeEventRepository: DaemonFileSystemChangeEventRepository;

    private constructor() {
        this.fileSystemChangeEventRepository =
            DaemonFileSystemChangeEventRepository.getInstance();
        this.changeEventActionProvider =
            ChangeEventActionProvider.getInstance();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new FileSystemChangeEventProvider();
        return this._instance;
    }

    private maskToString = (mask: number): Action => {
        switch (mask) {
            case 1:
                return Action.Access;
            case 1 << 1:
                return Action.Modify;
            case 1 << 2:
                return Action.Attrib;
            case 1 << 3:
                return Action.CloseWrite;
            case 1 << 4:
                return Action.CloseNowrite;
            case 1 << 6:
                return Action.MovedFrom;
            case 1 << 7:
                return Action.MovedTo;
            case 1 << 8:
                return Action.Create;
            case 1 << 9:
                return Action.Delete;
            case 1 << 10:
                return Action.DeleteSelf;
            case 1 << 34:
                return Action.SubDirectory;
            default:
                return Action.Unknown;
        }
    };

    private decodeAction = (action: number): Action[] => {
        const actions: Action[] = [];
        // Iterate through all possible masks (64-bit). Will break on overflow lol
        for (let bit = 1; bit !== 0; bit <<= 1) {
            if (action & bit) {
                actions.push(this.maskToString(bit));
            }
        }

        return actions;
    };

    private actionHandler: Record<
        Action,
        (event: FileSystemChangeEvent) => Promise<void> | void
    > = {
        [Action.Access]: () => {
            console.log('Access Action');
        },
        [Action.Attrib]: async (event) => {
            await this.changeEventActionProvider.handleAttrib.bind(
                this.changeEventActionProvider
            )(event);
        },
        [Action.Modify]: async (event) => {
            await this.changeEventActionProvider.handleModify.bind(
                this.changeEventActionProvider
            )(event);
        },
        [Action.CloseWrite]: async (event) => {
            await this.changeEventActionProvider.handleCloseWrite.bind(
                this.changeEventActionProvider
            )(event);
        },
        [Action.CloseNowrite]: () => {
            console.log('CloseNoWrite Action');
        },
        [Action.MovedFrom]: (event) => {
            this.changeEventActionProvider.handleDelete.bind(
                this.changeEventActionProvider
            )(event);
            // can just treat as a delete for now
        },
        [Action.MovedTo]: async (event) => {
            await this.changeEventActionProvider.handleCreate.bind(
                this.changeEventActionProvider
            )(event);
            // can treat as a create for now, ideally we will just modify paths and cu/du when paired with a movefrom so we do not need to delete+create
        },
        [Action.Create]: async (event) => {
            await this.changeEventActionProvider.handleCreate.bind(
                this.changeEventActionProvider
            )(event);
        },
        [Action.Delete]: (event) => {
            this.changeEventActionProvider.handleDelete.bind(
                this.changeEventActionProvider
            )(event);
        },
        [Action.DeleteSelf]: () => {
            console.log('DeleteSelf Action');
        },
        [Action.Rename]: () => {
            console.log('access');
        },
        [Action.SubDirectory]: () => {
            console.log('access');
        },
        [Action.Unknown]: () => {
            console.log('Unknown');
        }
    };

    public process = async (
        daemonEvent: DaemonFileSystemChangeEvent
    ): Promise<void> => {
        await this.fileSystemChangeEventRepository.insertFileSystemChangeEvent(
            daemonEvent
        );
        daemonEvent.events.forEach(async (event) => {
            const actions: Action[] = this.decodeAction(event.actions);
            actions.forEach(async (action) => {
                await this.actionHandler[action](event);
            });
        });
    };
}

export default FileSystemChangeEventProvider;
