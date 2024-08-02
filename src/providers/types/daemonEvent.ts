import {
    DaemonFileSystemChangeEvent,
    EventType
} from './fileSystemChangeEvent';
import { DaemonFullScanEvent } from './fullScanEvent';
import { DaemonHardwareEvent } from './hardwareEvent';

export interface DaemonEvent {
    event_type: EventType;
    event_data:
        | DaemonFullScanEvent
        | DaemonHardwareEvent
        | DaemonFileSystemChangeEvent;
}

export const fullScanEvent: DaemonFileSystemChangeEvent = {
    num_events: 1,
    events: [
        {
            event_id: 1,
            created_at: 1722574377,
            location: '/home/martin/Documents/linux-visualizer/src/logger',
            actions: 4,
            responsible_process: {
                user_id: {
                    real_id: -1,
                    effective_id: -1,
                    saved_set_id: -1,
                    filesystem_id: -1
                },
                group_id: {
                    real_id: 116637,
                    effective_id: -1,
                    saved_set_id: -1,
                    filesystem_id: -1
                },
                process_id: 116637,
                parent_process_id: 2018,
                process_name: 'Undetermined',
                parent_process_name: 'bash'
            },
            new_data: {
                data: {
                    path: '/home/martin/Documents/linux-visualizer/src/daemon/include/daemon.h',
                    status: 'success',
                    type: 'file',
                    attrib: {
                        perm: 95,
                        xattr: 524288,
                        inode: 691745,
                        filesystem: 'EXT2/3/4',
                        owner_id: 1000,
                        owner_name: 'martin',
                        group_id: 1000,
                        group_name: 'martin',
                        group_members: []
                    },
                    date_created: 1722031487,
                    du: 4096,
                    cu_size: 1973,
                    link: null,
                    device: null,
                    mounted: null,
                    is_socket: 0,
                    is_fifo: 0
                },
                children: []
            }
        }
    ]
};

export const testEvent: DaemonEvent = {
    event_type: 2,
    event_data: fullScanEvent
};
