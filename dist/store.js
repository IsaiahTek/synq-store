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
        const key = this.key;
        const id = item[key];
        const existingIndex = this.snapshot.findIndex((i) => i[key] === id);
        if (existingIndex !== -1) {
            // Replace the existing one
            this.setState(this.snapshot.map((i) => (i[key] === id ? item : i)));
        }
        else {
            // Add new
            this.setState([...this.snapshot, item]);
        }
    }
    update(item, key) {
        const newState = this.snapshot.map((snap) => snap[this.key] === key ? item : snap);
        this.setState(newState);
    }
    remove(key) {
        const newState = this.snapshot.filter((snap) => snap[this.key] !== key);
        this.setState(newState);
    }
    _indexOf(id) {
        return this.state.findIndex((i) => (i[this.key]) === id);
    }
    find(id) {
        return this.state.find((i) => (i[this.key]) === id);
    }
    findBy(predicate) {
        return this.state.find(predicate);
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
// export class Store<T> {
//   private state: T[];
//   private listeners = new Set<Listener<T[]>>();
//   public key: string = 'id';
//   private batching = false;
//   private dirty = false;
//   constructor(initial: T[] = [], key?: string) {
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
//   get snapshot(): T[] {
//     // Return a shallow copy for safety, so external code can’t mutate internal state
//     return [...this.state];
//   }
//   /** Add new item (immutable update) */
//   add(item: T): void {
//     this.setState([...this.state, item]);
//   }
//   /** Update item by key (immutable update) */
//   update(item: T): void {
//     const id = item[this.key];
//     if (id === undefined) return;
//     const index = this._indexOf(id);
//     if (index === -1) return;
//     const newState = [...this.state];
//     newState[index] = item;
//     this.setState(newState);
//   }
//   /** Remove item by key (immutable update) */
//   remove(id: T[keyof T]): void {
//     const newState = this.state.filter((i) => i[this.key] !== id);
//     this.setState(newState);
//   }
//   /** Find item by key */
//   find(id: T[keyof T]): T | undefined {
//     return this.state.find((i) => i[this.key] === id);
//   }
//   /** Find by custom predicate */
//   findBy(predicate: (item: T) => boolean): T | undefined {
//     return this.state.find(predicate);
//   }
//   /** Subscribe to state changes */
//   subscribe(listener: Listener<T[]>): () => void {
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
//   private setState(next: T[]): void {
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