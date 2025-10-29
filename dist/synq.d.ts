import { Store, SynqStore } from "./types";
declare const addStore: <T>(store: Store<T> | SynqStore<T & {
    id: string;
}>) => void, emptyStore: <T>(store: SynqStore<T & {
    id: string;
}> | Store<T>) => void, clearAllStores: () => void;
export { addStore, emptyStore, clearAllStores };
