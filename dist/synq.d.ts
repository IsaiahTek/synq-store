import { Store, SynqStore } from "./types";
export declare class Synq {
    /**
     * Holds all registered store instances managed by Synq.
     * Can contain both standard `Store` and `SynqStore` objects.
     *
     * @private
     */
    private _stores;
    /**
     * Private constructor to enforce the singleton pattern.
     * Instances should be accessed via `Synq.instance`.
     *
     * @private
     */
    private constructor();
    /**
     * The singleton instance of the Synq manager.
     *
     * @private
     */
    private static _instance?;
    /**
     * Retrieves the singleton instance of `Synq`.
     * Creates a new instance if one does not already exist.
     *
     * @returns The shared Synq instance.
     */
    static get instance(): Synq;
    /**
     * Adds a new store to the Synq manager.
     * This allows centralized tracking and control of multiple store instances.
     *
     * @template T - The store's data type.
     * @param store - The store instance to add (either `Store` or `SynqStore`).
     */
    addStore<T>(store: Store<T> | SynqStore<T & {
        id: string;
    }>): void;
    /**
     * Resets a specific store to its initial state.
     * If the store is a `SynqStore`, its status is also reset to `"idle"`.
     *
     * @template T - The store's data type.
     * @param store - The store instance to reset.
     */
    emptyStore<T>(store: SynqStore<T & {
        id: string;
    }> | Store<T>): void;
    /**
     * Clears the state of all stores managed by Synq.
     * Resets each store's state to an empty array and sets its status to `"idle"` if applicable.
     */
    clearAllStores(): void;
}

/**
 * Convenience exports for commonly used Synq operations.
 *
 * - `addStore`: Registers a store with the Synq manager.
 * - `emptyStore`: Clears the data in a specific store.
 * - `clearAllStores`: Resets all registered stores.
 */
declare const addStore: <T>(store: Store<T> | SynqStore<T & {
    id: string;
}>) => void, emptyStore: <T>(store: SynqStore<T & {
    id: string;
}> | Store<T>) => void, clearAllStores: () => void;
export { addStore, emptyStore, clearAllStores };
