import { EventEmitter } from "node:events";
import type { StoredLiveEvent } from "./events";

const bus = new EventEmitter();
bus.setMaxListeners(200);

export const publishLocalLiveEvent = (event: StoredLiveEvent) => {
  bus.emit("event", event);
};

export const subscribeLocalLiveEvents = (listener: (event: StoredLiveEvent) => void) => {
  bus.on("event", listener);
  return () => {
    bus.off("event", listener);
  };
};
