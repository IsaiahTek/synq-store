import { Listener } from "./types";
export declare class Store<StoreType> {
    key: string;
    private state;
    private listeners;
    constructor(initial: StoreType | StoreType[] | null, key?: string);
    get snapshot(): StoreType | StoreType[] | null;
    add(item: StoreType): void;
    private get isStoreArray();
    update(item: StoreType | ((state: StoreType) => StoreType), key: string): void;
    remove(key: string): void;
    private _indexOf;
    find(id: unknown): StoreType | undefined;
    findBy(predicate: (item: StoreType) => boolean): StoreType | undefined;
    /** Replace state and notify subscribers */
    setState(next: StoreType | StoreType[]): void;
    subscribe(listener: Listener<StoreType | StoreType[]>): () => boolean;
}
