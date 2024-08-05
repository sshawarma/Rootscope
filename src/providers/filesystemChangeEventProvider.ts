import MongoDB from '../mongo/mongo';
import ChangeEventActionProvider from './changeEventActionProvider';
import {
    DaemonFileSystemChangeEvent,
    FileSystemChangeEvent
} from './types/fileSystemChangeEvent';

export enum Action {
    Attrib = 'attrib',
    Access = 'access',
    Modify = 'modify',
    CloseWrite = 'close-write',
    CloseNowrite = 'close-nowrite',
    Open = 'open',
    MovedFrom = 'moved_from',
    MovedTo = 'moved_to',
    Create = 'create',
    Delete = 'delete',
    DeleteSelf = 'delete-self',
    MoveSelf = 'move-self',
    FilesystemError = 'filesystem-error',
    ChildAction = 'child-action',
    Rename = 'rename',
    SubDirectory = 'sub-directory',
    Unknown = 'unknown'
}

class FileSystemChangeEventProvider {
    private static _instance: FileSystemChangeEventProvider;

    private changeEventActionProvider: ChangeEventActionProvider;

    private mongo: MongoDB;

    private constructor() {
        this.mongo = MongoDB.getInstance();
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
            case 1 << 5:
                return Action.Open;
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
            case 1 << 11:
                return Action.MoveSelf;
            case 1 << 15:
                return Action.FilesystemError;
            case 1 << 27:
                return Action.ChildAction;
            case 1 << 32:
                return Action.Rename;
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
        (event: FileSystemChangeEvent) => void
    > = {
        [Action.Access]: () => {
            console.log('access');
        },
        [Action.Attrib]: (event) => {
            this.changeEventActionProvider.handleAttrib.bind(
                this.changeEventActionProvider
            )(event);
        },
        [Action.Modify]: () => {
            console.log('modify');
        },
        [Action.CloseWrite]: () => {
            console.log('closewrite');
        },
        [Action.CloseNowrite]: () => {
            console.log('closenowrite');
        },
        [Action.Open]: () => {
            console.log('opem');
        },
        [Action.MovedFrom]: () => {
            console.log('access');
        },
        [Action.MovedTo]: () => {
            console.log('access');
        },
        [Action.Create]: () => {
            console.log('access');
        },
        [Action.Delete]: () => {
            console.log('access');
        },
        [Action.DeleteSelf]: () => {
            console.log('access');
        },
        [Action.MoveSelf]: () => {
            console.log('access');
        },
        [Action.FilesystemError]: () => {
            console.log('access');
        },
        [Action.ChildAction]: () => {
            console.log('access');
        },
        [Action.Rename]: () => {
            console.log('access');
        },
        [Action.SubDirectory]: () => {
            console.log('access');
        },
        [Action.Unknown]: () => {
            console.log('access');
        }
    };

    public process = async (
        daemonEvent: DaemonFileSystemChangeEvent
    ): Promise<void> => {
        await this.mongo.insertFileSystemChangeEvent(daemonEvent);
        // iterate the events
        daemonEvent.events.forEach((event) => {
            const actions: Action[] = this.decodeAction(event.actions);
            actions.forEach((action) => {
                this.actionHandler[action](event);
            });
        });
        // decode the action int
        // based on the actions perform operations
        // actions come in groups eg. attrib/close-write so we must perform both if they both require operations
        // not all actions require operations
        // must be modular so we can concatenate operations together since there are many permutations
    };
}

export default FileSystemChangeEventProvider;
