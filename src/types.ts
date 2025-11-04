/**
 * Represents the current operational status of a SynqStore.
 */
export type SynqStoreStatus = "idle" | "loading" | "error" | "success";

/**
 * A generic record type for flexible store structures.
 */
export type StoreType = Record<string, any>;

// export type StoreType = StoreObject | StoreObject[];

/**
 * Configuration options for connecting a SynqStore to a remote server.
 * 
 * @template T - The main data type stored.
 * @template B - The optional extra payload type used for operations.
 */
export type ServerOptions<T, B> = {
  /**
   * Optional async function to fetch the initial list of items from the server.
   * Should return an array of items of type `T`.
   */
  fetcher?: () => Promise<T[]>;

  /**
   * Optional async function to add a new item to the server.
   * 
   * @param item - The partial item data to be added.
   * @param extra - Optional additional metadata or context.
   * @returns The newly created item from the server.
   */
  add?: (item: Partial<T>, extra?: Partial<B>) => Promise<T>;

  /**
   * Optional async function to update an existing item on the server.
   * 
   * @param item - The item with updated fields.
   * @returns The updated item as returned from the server.
   */
  update?: (item: Partial<T>) => Promise<T>;

  /**
   * Optional async function to remove an item from the server by its ID.
   * 
   * @param id - The unique identifier of the item to remove.
   */
  remove?: (id: string) => Promise<void>;

  /**
   * Optional async function to add multiple items to the server at once.
   * 
   * @param items - An array of partial items to add.
   * @returns The array of created items from the server.
   */
  addMany?: (items: Partial<T>[]) => Promise<T[]>;

  /**
   * Optional interval (in milliseconds) for automatically re-fetching data.
   */
  interval?: number;

  /**
   * Whether the store should automatically fetch data on initialization.
   * Defaults to `false` if not specified.
   */
  autoFetchOnStart?: boolean;

  /**
   * Optional custom function for generating temporary IDs
   * for client-side created items before they are synced.
   */
  idFactory?: () => string;
};

/**
 * Represents a simple reactive store.
 * 
 * @template T - The type of data managed by the store.
 */
export type Store<T> = {
  /**
   * A readonly snapshot of the current store state.
   */
  readonly snapshot: T;

  /**
   * Replaces the store’s current state with a new one.
   * 
   * @param next - The new state to set.
   */
  setState(next: T): void;

  /**
   * Subscribes a listener function to state changes.
   * 
   * @param listener - A callback invoked whenever the state changes.
   * @returns A cleanup function to unsubscribe the listener.
   */
  subscribe(listener: Listener<T>): () => void;
};

/**
 * Function signature for listeners that react to store state changes.
 * 
 * @template T - The type of data emitted by the store.
 */
export type Listener<T> = (state: T) => void;

/**
 * An advanced reactive data store for synchronizing with remote servers.
 * 
 * @template T - The entity type, which must include an `id` property.
 */
export type SynqStore<T extends { id: string }> = Store<T[]> & {
  /**
   * The current status of the store (e.g., loading, idle, error, success).
   */
  status: SynqStoreStatus;

  /**
   * Fetches the latest items from the server and updates the store state.
   */
  fetch(): Promise<void>;

  /**
   * Adds a new item to both the store and server.
   * 
   * @param item - The item to add (may be partial).
   */
  add(item: Partial<T>): Promise<void>;

  /**
   * Adds multiple items to both the store and server.
   * 
   * @param items - The list of items to add.
   */
  addMany(items: T[]): Promise<void>;

  /**
   * Updates an existing item in both the store and server.
   * 
   * @param item - The item with updated fields.
   */
  update(item: T): Promise<void>;

  /**
   * Removes an item from both the store and server by ID.
   * 
   * @param id - The ID of the item to remove.
   */
  remove(id: string): Promise<void>;

  /**
   * Disposes of the store by cleaning up subscriptions and resources.
   */
  dispose(): void;
};
