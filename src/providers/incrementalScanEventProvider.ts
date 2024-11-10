import {
    isDirectory,
    mapFileDataToDirectories,
    transformTree
} from '../lib/transformTree';
import DirectoriesRepository, {
    UpdateDirectoryForIncrementalScanResult
} from '../mongo/directoriesRepository';
import { Directory } from '../mongo/types/schema';
import {
    DaemonFullScanEvent,
    FileData,
    FileDataType,
    Status
} from './types/fullScanEvent';
import { IncrementalScanEvent } from './types/incrementalScanEvent';

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
    First deletes the event from its parent's directoryChildren.
    Uses that to finalize the paths to delete by appending the event's children with its respective database entry's fileChildren
    */
    private processDeleted = async (event: DaemonFullScanEvent) => {
        const directoriesToDelete: string[] = [event.data.path];
        event.children.forEach((child) => {
            if (!isDirectory(child.data.type)) {
                directoriesToDelete.push(child.data.path);
            }
        });

        const fileDataDirectoryToDelete: Directory =
            await this.directoriesRepository.removeDirectoryInParentChildren(
                event.data.path
            );

        if (fileDataDirectoryToDelete) {
            directoriesToDelete.push(...fileDataDirectoryToDelete.fileChildren);
        }

        console.log(
            `IncrementalScanProvider - Deleting directories at paths: ${directoriesToDelete}`
        );

        await this.directoriesRepository.deleteDirectoriesAtPaths(
            directoriesToDelete
        );
    };

    /*
    Upserts the event in the DB. Then replaces/creates its fileChildren on update/insert. Then creates its new children directories
    */
    private processUpdated = async (event: DaemonFullScanEvent) => {
        const fileChildren: FileData[] = [];
        const directoryChildren: DaemonFullScanEvent[] = [];
        event.children.forEach((child) => {
            if (!isDirectory(child.data.type)) {
                fileChildren.push(child.data);
            } else if (isDirectory(child.data.type)) {
                directoryChildren.push(child);
            }
        });

        const result: UpdateDirectoryForIncrementalScanResult =
            await this.directoriesRepository.updateDirectoryForIncrementalScan(
                fileChildren,
                directoryChildren,
                event.data
            );

        if (result.parentDirectoryInDb) {
            await this.directoriesRepository.replaceFileChildren(
                fileChildren,
                result.parentDirectoryInDb
            );
        } else {
            const fileChildrenToDirectory: Directory[] =
                mapFileDataToDirectories(
                    fileChildren,
                    result.parentDirectoryId
                );

            await this.directoriesRepository.insertNewDirectoryList(
                fileChildrenToDirectory
            );
        }

        const directoryChildrenToDirectory: Directory[] = directoryChildren
            .flatMap((directory) => transformTree(directory))
            .map((child) => {
                return {
                    ...child,
                    parentId: child.parentId ?? result.parentDirectoryId
                };
            });

        await this.directoriesRepository.insertNewDirectoryList(
            directoryChildrenToDirectory
        );
    };

    public process = async (incrementalScanEvent: IncrementalScanEvent) => {
        const events: DaemonFullScanEvent[] = incrementalScanEvent.events;
        for (const event of events) {
            if (event.data.status === Status.UPDATED) {
                await this.processUpdated(event);
            } else if (event.data.status === Status.DELETED) {
                await this.processDeleted(event);
            }
        }
    };
}

export default IncrementalScanEventProvider;
