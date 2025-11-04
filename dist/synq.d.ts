import { Store, SynqStore } from "./types";
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
