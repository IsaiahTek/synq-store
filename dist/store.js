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
/**
 * A lightweight reactive state management class that provides
 * basic CRUD operations and subscription mechanisms.
 *
 * Acts as the base class for `SynqStore`, allowing both local
 * and server-synced data handling.
 *
 * @template StoreType - The type of data managed by this store.
 */
class Store {
    /**
     * Initializes a new store with an initial state and optional key for identification.
     * Automatically registers the store with the global `Synq` instance.
     *
     * @param initial - The initial state value or list of items.
     * @param key - Optional unique key for identifying items (defaults to `"id"`).
     */
    constructor(initial, key) {
        /**
         * The property key used to uniquely identify each item in the store.
         * Defaults to `"id"`.
         */
        this.key = 'id';
        /**
         * A set of listeners that are notified whenever the store's state changes.
         */
        this.listeners = new Set();
        this.state = initial;
        if (key) {
            this.key = key;
        }
        // Defer store registration until the current event loop completes
        queueMicrotask(async () => {
            const { addStore } = await Promise.resolve().then(() => __importStar(require("./synq")));
            addStore(this);
        });
    }
    /**
     * Returns the current snapshot of the store's state.
     * The snapshot is a direct reference to the internal state.
     */
    get snapshot() {
        return this.state;
    }
    /**
     * Adds a new item to the store.
     * Prevents duplicate entries if an item with the same key already exists.
     *
     * @param item - The item to add to the store.
     */
    add(item) {
        if (Array.isArray(this.snapshot)) {
            const id = item[this.key];
            const existingIndex = (Array.isArray(this.snapshot) ? this.snapshot : [this.snapshot])
                .findIndex((i) => i[this.key] === id);
            if (existingIndex !== -1)
                return;
            this.setState([...this.snapshot, item]);
        }
        else {
            this.setState(item);
        }
    }
    /**
     * Indicates whether the store currently holds an array of items.
     *
     * @returns `true` if the state is an array; otherwise, `false`.
     */
    get isStoreArray() {
        return Array.isArray(this.state);
    }
    /**
     * Updates an existing item in the store.
     * If the item doesn't exist, it will be added instead.
     *
     * Supports functional updates, allowing transformations based on current state.
     *
     * @param item - The new value or a function producing the new value.
     * @param key - The unique identifier of the item to update.
     */
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
    /**
     * Removes an item from the store by its key.
     *
     * @param key - The unique identifier of the item to remove.
     */
    remove(key) {
        if (this.isStoreArray) {
            const newState = this.snapshot.filter((snap) => snap[this.key] !== key);
            this.setState(newState);
        }
    }
    /**
     * Returns the index of an item in the store’s array by its unique ID.
     *
     * @param id - The unique identifier to search for.
     * @returns The index of the matching item, or -1 if not found.
     */
    _indexOf(id) {
        return (Array.isArray(this.snapshot) ? this.snapshot : []).findIndex((i) => i[this.key] === id);
    }
    /**
     * Finds an item in the store by its unique identifier.
     *
     * @param id - The identifier to match against the store’s key.
     * @returns The found item, or `undefined` if not found.
     */
    find(id) {
        if (this.isStoreArray) {
            return this.snapshot.find((i) => i[this.key] === id);
        }
    }
    /**
     * Finds an item in the store that matches a custom condition.
     *
     * @param predicate - A function that returns `true` for the desired item.
     * @returns The first matching item, or `undefined` if none match.
     */
    findBy(predicate) {
        if (this.isStoreArray) {
            return this.snapshot.find(predicate);
        }
    }
    /**
     * Replaces the current state of the store and notifies all subscribers.
     * Prevents redundant updates if the new state is identical to the current one.
     *
     * @param next - The new state to set.
     */
    setState(next) {
        if (Object.is(this.state, next))
            return; // prevent redundant updates
        this.state = next;
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
    /**
     * Subscribes a listener function to state changes in the store.
     *
     * @param listener - The function to invoke whenever the state changes.
     * @returns A cleanup function to remove the listener.
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}
exports.Store = Store;
//# sourceMappingURL=store.js.map