// -----------------------------

// import { addStore } from "./synq";
import { Listener } from "./types";

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
export class Store<StoreType> {
  /**
   * The property key used to uniquely identify each item in the store.
   * Defaults to `"id"`.
   */
  public key: string = 'id';

  /**
   * The current state of the store. Can be a single object, an array of objects, or null.
   */
  private state: StoreType | StoreType[] | null;

  /**
   * A set of listeners that are notified whenever the store's state changes.
   */
  private listeners = new Set<Listener<StoreType | StoreType[]>>();

  /**
   * Initializes a new store with an initial state and optional key for identification.
   * Automatically registers the store with the global `Synq` instance.
   * 
   * @param initial - The initial state value or list of items.
   * @param key - Optional unique key for identifying items (defaults to `"id"`).
   */
  constructor(initial: StoreType | StoreType[] | null, key?: string) {
    this.state = initial;
    if (key) {
      this.key = key;
    }

    // Defer store registration until the current event loop completes
    queueMicrotask(async () => {
      const { addStore } = await import("./synq");
      addStore(this);
    });
  }

  /**
   * Returns the current snapshot of the store's state.
   * The snapshot is a direct reference to the internal state.
   */
  get snapshot(): StoreType | StoreType[] | null {
    return this.state;
  }

  /**
   * Adds a new item to the store.
   * Prevents duplicate entries if an item with the same key already exists.
   * 
   * @param item - The item to add to the store.
   */
  public add(item: StoreType): void {
    if (Array.isArray(this.snapshot)) {
      const id = (item as Record<string, unknown>)[this.key];
      const existingIndex = (Array.isArray(this.snapshot) ? this.snapshot : [this.snapshot])
        .findIndex((i) => (i as Record<string, unknown>)[this.key] === id);
      if (existingIndex !== -1) return;
      this.setState([...this.snapshot, item]);
    } else {
      this.setState(item);
    }
  }

  /**
   * Indicates whether the store currently holds an array of items.
   * 
   * @returns `true` if the state is an array; otherwise, `false`.
   */
  private get isStoreArray(): boolean {
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
  public update(item: StoreType | ((state: StoreType) => StoreType), key: string): void {
    if (this.isStoreArray) {
      const index = this._indexOf(key);
      const current = index !== -1 ? (this.state as StoreType[])[index] : undefined;

      const next =
        typeof item === "function"
          ? (item as (state: StoreType | undefined) => StoreType)(current)
          : item;

      const newState = [...(this.state as StoreType[])];

      if (index !== -1) newState[index] = next;
      else newState.push(next);

      this.state = newState;
    } else {
      const next =
        typeof item === "function"
          ? (item as (state: StoreType | undefined) => StoreType)(this.state as StoreType)
          : item;

      this.state = next;
    }

    if (this.state !== null) {
      this.listeners.forEach((listener) => listener(this.state!));
    }
  }

  /**
   * Removes an item from the store by its key.
   * 
   * @param key - The unique identifier of the item to remove.
   */
  public remove(key: string) {
    if (this.isStoreArray) {
      const newState = (this.snapshot as StoreType[]).filter(
        (snap) => (snap as Record<string, unknown>)[this.key] !== key
      );
      this.setState(newState);
    }
  }

  /**
   * Returns the index of an item in the store’s array by its unique ID.
   * 
   * @param id - The unique identifier to search for.
   * @returns The index of the matching item, or -1 if not found.
   */
  private _indexOf(id: unknown): number {
    return (Array.isArray(this.snapshot) ? this.snapshot : []).findIndex(
      (i) => (i as Record<string, unknown>)[this.key] === id
    );
  }

  /**
   * Finds an item in the store by its unique identifier.
   * 
   * @param id - The identifier to match against the store’s key.
   * @returns The found item, or `undefined` if not found.
   */
  find(id: unknown) {
    if (this.isStoreArray) {
      return (this.snapshot as StoreType[]).find(
        (i) => (i as Record<string, unknown>)[this.key] === id
      );
    }
  }

  /**
   * Finds an item in the store that matches a custom condition.
   * 
   * @param predicate - A function that returns `true` for the desired item.
   * @returns The first matching item, or `undefined` if none match.
   */
  findBy(predicate: (item: StoreType) => boolean) {
    if (this.isStoreArray) {
      return (this.snapshot as StoreType[]).find(predicate);
    }
  }

  /**
   * Replaces the current state of the store and notifies all subscribers.
   * Prevents redundant updates if the new state is identical to the current one.
   * 
   * @param next - The new state to set.
   */
  public setState(next: StoreType | StoreType[]): void {
    if (Object.is(this.state, next)) return; // prevent redundant updates
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
  subscribe(listener: Listener<StoreType | StoreType[]>) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
