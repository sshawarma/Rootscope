import { ObjectId } from "mongodb";
import { DaemonHardwareEvent, TransformedNode } from "./types/eventTypes";
import MongoDB from "../lib/mongo";

class HardwareEventProvider {
  private static _instance: HardwareEventProvider;
  
  private mongo: MongoDB;

  private constructor() {
    this.mongo = MongoDB.getInstance()
  }

  static getInstance() {
    if (this._instance) {
      return this._instance;
    }

    this._instance = new HardwareEventProvider();
    return this._instance;
  }

  public process = (directory: DaemonHardwareEvent): void => {
    // this.mongo.insertHardwareEvent(directory)
}

}

export default HardwareEventProvider;
