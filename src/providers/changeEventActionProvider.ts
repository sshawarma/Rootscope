import MongoDB from '../mongo/mongo';
import { FileSystemChangeEvent } from './types/fileSystemChangeEvent';

class ChangeEventActionProvider {
    private static _instance: ChangeEventActionProvider;

    private mongo: MongoDB;

    private constructor() {
        this.mongo = MongoDB.getInstance();
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
        await this.mongo.updateAttributes(
            event.location,
            event.new_data.data.attrib
        );
    };
}

export default ChangeEventActionProvider;
