import { UpdateFilter } from 'mongodb';
import { transformTree } from '../lib/transformTree';
import DirectoriesRepository from '../mongo/directoriesRepository';
import { Directory } from '../mongo/types/schema';
import { DaemonFullScanEvent } from './types/fullScanEvent';

class IncrementalScanEventProvider {
    private static _instance: IncrementalScanEventProvider;

    private directoriesRepository: DirectoriesRepository;

    private constructor() {
        this.directoriesRepository = DirectoriesRepository.getInstance();
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new IncrementalScanEventProvider();
        return this._instance;
    }
    /*
Transform our incrementalEvent with transformTree to get our Directory[]
Map through Directory[] to return updateOne[]
in the mongoUpdate ensure that the children is only updated if updateChildren is true
write to mongo using bulkWrite with the list of updateOne
This way we will keep the record in the DB without deleting anything but just update its values and children if need be

So in this approach we will NOT end up removing any children which where found to be deleted from the incScan
the ids inside of children will also not correspond to that of what are in mongo
we will need a new transformTree function for incremental scan
*/
    public process = (event: DaemonFullScanEvent): void => {
        const directories: Directory[] = transformTree(event);
        directories.map((directory) => {
            const updatedDirectory: Directory = {
                ...directory,
                children: directory.update_children ? directory.children : []
            };

            const x: UpdateFilter<Directory> = {
                updateOne: {
                    filter: {
                        path: directory.path
                    },
                    update: {
                        $set: {
                            parentId: directory.parentId,
                            // update_children: directory.update_children,
                            // status: string,
                            // type: string,
                            // attrib: Attrib,
                            // date_created: number,
                            // du: number,
                            // cu_size: number,
                            // link: string | null,
                            // device: string | null,
                            // mounted: string | null,
                            // is_socket: number,
                            // is_fifo: number,
                            // updatedAt: Date,
                            // modifiedAt?: Date,
                            // children: directory.update_children
                        }
                    },
                    upsert: true
                }
            };
        });
    };
}

export default IncrementalScanEventProvider;
