import { Db, MongoClient } from 'mongodb';

class MongoDB {
    private static _instance: MongoDB;
    private client: MongoClient;
    public db: Db;

    private constructor() {
        try {
            this.client = new MongoClient(process.env.MONGO_URI);
            this.client.connect();

            this.db = this.client.db('rootscope');
        } catch {
            console.log('Failed to establish mongo connection');
        }
    }

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new MongoDB();
        return this._instance;
    }

    public getDB() {}
}

export default MongoDB;
