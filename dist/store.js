"use strict";
// -----------------------------
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = void 0;
// -----------------------------
class Store {
    constructor(initial, key) {
        this.key = 'id';
        this.listeners = new Set();
        this.state = initial;
        if (key) {
            this.key = key;
        }
        queueMicrotask(async () => {
            // import("./synq").then(({ addStore }) => addStore(this));
            const { addStore } = await Promise.resolve().then(() => __importStar(require("./synq")));
            addStore(this);
        });
    }
    get snapshot() {
        return this.state;
    }
    add(item) {
        if (Array.isArray(this.snapshot)) {
            const id = item[this.key];
            const existingIndex = (Array.isArray(this.snapshot) ? this.snapshot : [this.snapshot]).findIndex((i) => i[this.key] === id);
            if (existingIndex !== -1)
                return;
            this.setState([...this.snapshot, item]);
        }
        else {
            this.setState(item);
        }
    }
    get isStoreArray() {
        return Array.isArray(this.state);
    }
    update(item, key) {
        if (this.isStoreArray) {
            const index = this._indexOf(key);
            const current = index !== -1 ? this.state[index] : undefined;
            const next = typeof item === "function"
                ? item(current)
                : item;
            const newState = [...this.state];
            if (index !== -1)
                newState[index] = next;
            else
                newState.push(next);
            this.state = newState;
        }
        else {
            const next = typeof item === "function"
                ? item(this.state)
                : item;
            this.state = next;
        }
        if (this.state !== null) {
            this.listeners.forEach((listener) => listener(this.state));
        }
    }
    remove(key) {
        if (this.isStoreArray) {
            const newState = this.snapshot.filter((snap) => snap[this.key] !== key);
            this.setState(newState);
        }
    }
    _indexOf(id) {
        return (Array.isArray(this.snapshot) ? this.snapshot : []).findIndex((i) => (i[this.key]) === id);
    }
    find(id) {
        if (this.isStoreArray) {
            return this.snapshot.find((i) => (i[this.key]) === id);
        }
    }
    findBy(predicate) {
        if (this.isStoreArray) {
            return this.snapshot.find(predicate);
        }
    }
    /** Replace state and notify subscribers */
    setState(next) {
        if (Object.is(this.state, next))
            return; // prevent redundant updates
        this.state = next;
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}
exports.Store = Store;
// import { Listener } from "./types";
// export class Store<StoreType> {
//   private state: StoreType;
//   private listeners = new Set<Listener<StoreType>>();
//   public key: string = 'id';
//   private batching = false;
//   private dirty = false;
//   constructor(initial: StoreType = [], key?: string) {
//     this.state = [...initial];
//     if (key) {
//       this.key = key
//     }
//     queueMicrotask(async () => {
//       const { addStore } = await import("./synq");
//       addStore(this);
//     });
//   }
//   /** Returns current immutable snapshot */
//   get snapshot(): StoreType {
//     // Return a shallow copy for safety, so external code can’t mutate internal state
//     return [...this.state];
//   }
//   /** Add new item (immutable update) */
//   add(item: StoreType): void {
//     this.setState([...this.state, item]);
//   }
//   /** Update item by key (immutable update) */
//   update(item: StoreType): void {
//     const id = item[this.key];
//     if (id === undefined) return;
//     const index = this._indexOf(id);
//     if (index === -1) return;
//     const newState = [...this.state];
//     newState[index] = item;
//     this.setState(newState);
//   }
//   /** Remove item by key (immutable update) */
//   remove(id: StoreType[keyof StoreType]): void {
//     const newState = this.state.filter((i) => i[this.key] !== id);
//     this.setState(newState);
//   }
//   /** Find item by key */
//   find(id: StoreType[keyof StoreType]): StoreType | undefined {
//     return this.state.find((i) => i[this.key] === id);
//   }
//   /** Find by custom predicate */
//   findBy(predicate: (item: StoreType) => boolean): StoreType | undefined {
//     return this.state.find(predicate);
//   }
//   /** Subscribe to state changes */
//   subscribe(listener: Listener<StoreType>): () => void {
//     this.listeners.add(listener);
//     return () => this.listeners.delete(listener);
//   }
//   /** Begin a batch update (no re-render until commit) */
//   beginBatch(): void {
//     this.batching = true;
//     this.dirty = false;
//   }
//   /** End batch update (triggers re-render once if needed) */
//   endBatch(): void {
//     this.batching = false;
//     if (this.dirty) {
//       this.notify();
//       this.dirty = false;
//     }
//   }
//   /** Perform batch operations with automatic handling */
//   batch(fn: () => void): void {
//     this.beginBatch();
//     try {
//       fn();
//     } finally {
//       this.endBatch();
//     }
//   }
//   /** Replace state and notify subscribers */
//   private setState(next: StoreType): void {
//     if (Object.is(this.state, next)) return;
//     this.state = next;
//     if (this.batching) {
//       this.dirty = true;
//     } else {
//       this.notify();
//     }
//   }
//   /** Notify all listeners */
//   private notify(): void {
//     for (const listener of this.listeners) {
//       listener(this.state);
//     }
//   }
//   /** Utility: find index by id */
//   private _indexOf(id: unknown): number {
//     return this.state.findIndex((i) => i[this.key] === id);
//   }
// }
//# sourceMappingURL=store.js.map