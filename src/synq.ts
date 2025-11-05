import { SynqStore as ST } from "./synq_store";
import { Store, SynqStore } from "./types";

export class Synq {
    /**
     * Holds all registered store instances managed by Synq.
     * Can contain both standard `Store` and `SynqStore` objects.
     * 
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _stores: (SynqStore<any> | Store<any>)[] = []

    /**
     * Private constructor to enforce the singleton pattern.
     * Instances should be accessed via `Synq.instance`.
     * 
     * @private
     */
    private constructor() { }

    /**
     * The singleton instance of the Synq manager.
     * 
     * @private
     */
    private static _instance?: Synq;

    /**
     * Retrieves the singleton instance of `Synq`.
     * Creates a new instance if one does not already exist.
     * 
     * @returns The shared Synq instance.
     */
    public static get instance(): Synq {
        if (!this._instance) {
            this._instance = new Synq();
        }
        return this._instance;
    }

    /**
     * Adds a new store to the Synq manager.
     * This allows centralized tracking and control of multiple store instances.
     * 
     * @template T - The store's data type.
     * @param store - The store instance to add (either `Store` or `SynqStore`).
     */
    public addStore<T>(store: Store<T> | SynqStore<T & {id: string}>) {
        // if(store instanceof SynqStore)
        Synq.instance._stores.push(store);
    }

    /**
     * Resets a specific store to its initial state.
     * If the store is a `SynqStore`, its status is also reset to `"idle"`.
     * 
     * @template T - The store's data type.
     * @param store - The store instance to reset.
     */
    public emptyStore<T>(store: SynqStore<T & {id: string}> | Store<T>) {
        const foundStore = Synq.instance._stores.find((s) => s === store);
        if(!foundStore) return;
        if(foundStore instanceof ST){
            foundStore.status = 'idle';
        }
        foundStore.setState([]);
    }

    /**
     * Clears the state of all stores managed by Synq.
     * Resets each store's state to an empty array and sets its status to `"idle"` if applicable.
     */
    public clearAllStores() {
        Synq.instance._stores.forEach((store) => {
            if(store instanceof ST){
                store.status = 'idle';
            }
            store.setState([])
        })
    }

}

/**
 * Convenience exports for commonly used Synq operations.
 * 
 * - `addStore`: Registers a store with the Synq manager.
 * - `emptyStore`: Clears the data in a specific store.
 * - `clearAllStores`: Resets all registered stores.
 */
const {addStore, emptyStore, clearAllStores} = Synq.instance;
export {addStore, emptyStore, clearAllStores};
