import { Store } from "./store";
import { ServerOptions, SynqStoreStatus } from "./types";
/**
 * A server-synced reactive store inspired by TanStack Query.
 *
 * Provides methods to fetch, add, update, and remove data
 * while keeping the local state synchronized with a remote server.
 *
 * @template T - The type of data managed by the store.
 * @template B - The type of extra payload or metadata used for operations.
 */
export declare class SynqStore<T, B> extends Store<T> {
    /**
     * The current network or sync status of the store.
     * Can be `"idle"`, `"loading"`, `"error"`, or `"success"`.
     */
    status: SynqStoreStatus;
    /**
     * Configuration options defining how the store interacts with the server.
     * Includes handlers for fetching, adding, updating, and removing data.
     */
    private options;
    /**
     * Interval timer reference used for periodic fetching,
     * created only if `options.interval` and `options.fetcher` are provided.
     */
    private timer?;
    /**
     * Creates a new SynqStore instance with optional initial data and configuration.
     *
     * @param initial - The initial value or list of values for the store.
     * @param options - Configuration options defining server interaction methods.
     * @param key - Optional unique identifier key for items in the store.
     */
    constructor(initial: T, options: ServerOptions<T, B>, key?: string);
    /**
     * Indicates whether the store is currently loading data.
     *
     * @returns `true` if status is `"loading"`.
     */
    get isLoading(): boolean;
    /**
     * Indicates whether the last operation resulted in an error.
     *
     * @returns `true` if status is `"error"`.
     */
    get isError(): boolean;
    /**
     * Indicates whether the store is in a successful state.
     *
     * @returns `true` if status is `"success"`.
     */
    get isSuccess(): boolean;
    /**
     * Fetches the latest data from the server using the configured `fetcher`.
     * Updates the store’s state with the fetched data and sets the appropriate status.
     *
     * If the fetch fails, the store rolls back to the previous snapshot.
     */
    fetch(): Promise<void>;
    /**
     * Adds a new item to the store and optionally syncs it with the server.
     * Performs optimistic updates by assigning a temporary ID.
     *
     * @param item - The item data to add (partial allowed).
     * @param xId - Optional extra payload or context for the request.
     */
    add(item: Partial<T>, xId?: B): Promise<void>;
    /**
     * Adds multiple items to the store and optionally syncs them with the server.
     * Supports optimistic updates by merging new items with the current snapshot.
     *
     * @param items - The list of items to add.
     */
    addMany(items: T[]): Promise<void>;
    /**
     * Updates an existing item in the store and optionally syncs the changes to the server.
     *
     * @param item - The updated item data.
     */
    update(item: T): Promise<void>;
    /**
     * Removes an item from the store and optionally deletes it on the server.
     * If the removal fails, the deleted item is restored.
     *
     * @param id - The unique identifier of the item to remove.
     */
    remove(id: string): Promise<void>;
    /**
     * Disposes of the store by clearing its internal timer.
     * Should be called when the store is no longer needed.
     */
    dispose(): void;
}
