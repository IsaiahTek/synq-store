import { Listener } from "./types";
/**
 * A lightweight reactive state management class that provides
 * basic CRUD operations and subscription mechanisms.
 *
 * Acts as the base class for `SynqStore`, allowing both local
 * and server-synced data handling.
 *
 * @template StoreType - The type of data managed by this store.
 */
export declare class Store<StoreType> {
    /**
     * The property key used to uniquely identify each item in the store.
     * Defaults to `"id"`.
     */
    key: string;
    /**
     * The current state of the store. Can be a single object, an array of objects, or null.
     */
    private state;
    /**
     * A set of listeners that are notified whenever the store's state changes.
     */
    private listeners;
    /**
     * Initializes a new store with an initial state and optional key for identification.
     * Automatically registers the store with the global `Synq` instance.
     *
     * @param initial - The initial state value or list of items.
     * @param key - Optional unique key for identifying items (defaults to `"id"`).
     */
    constructor(initial: StoreType, key?: string);
    /**
     * Returns the current snapshot of the store's state.
     * The snapshot is a direct reference to the internal state.
     */
    get snapshot(): StoreType | StoreType[] | null;
    /**
     * Adds a new item to the store.
     * Prevents duplicate entries if an item with the same key already exists.
     *
     * @param item - The item to add to the store.
     */
    add(item: StoreType): void;
    /**
     * Indicates whether the store currently holds an array of items.
     *
     * @returns `true` if the state is an array; otherwise, `false`.
     */
    private get isStoreArray();
    /**
     * Updates an existing item in the store.
     * If the item doesn't exist, it will be added instead.
     *
     * Supports functional updates, allowing transformations based on current state.
     *
     * @param item - The new value or a function producing the new value.
     * @param key - The unique identifier of the item to update.
     */
    update(item: StoreType | ((state: StoreType) => StoreType), key: string): void;
    /**
     * Removes an item from the store by its key.
     *
     * @param key - The unique identifier of the item to remove.
     */
    remove(key: string): void;
    /**
     * Returns the index of an item in the store’s array by its unique ID.
     *
     * @param id - The unique identifier to search for.
     * @returns The index of the matching item, or -1 if not found.
     */
    private _indexOf;
    /**
     * Finds an item in the store by its unique identifier.
     *
     * @param id - The identifier to match against the store’s key.
     * @returns The found item, or `undefined` if not found.
     */
    find(id: unknown): StoreType | undefined;
    /**
     * Finds an item in the store that matches a custom condition.
     *
     * @param predicate - A function that returns `true` for the desired item.
     * @returns The first matching item, or `undefined` if none match.
     */
    findBy(predicate: (item: StoreType) => boolean): StoreType | undefined;
    /**
     * Replaces the current state of the store and notifies all subscribers.
     * Prevents redundant updates if the new state is identical to the current one.
     *
     * @param next - The new state to set.
     */
    setState(next: StoreType | StoreType[]): void;
    /**
     * Subscribes a listener function to state changes in the store.
     *
     * @param listener - The function to invoke whenever the state changes.
     * @returns A cleanup function to remove the listener.
     */
    subscribe(listener: Listener<StoreType | StoreType[]>): () => boolean;
}
