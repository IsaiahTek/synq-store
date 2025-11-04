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
export class SynqStore<T, B> extends Store<T> {
  /**
   * The current network or sync status of the store.
   * Can be `"idle"`, `"loading"`, `"error"`, or `"success"`.
   */
  status: SynqStoreStatus = "idle";

  /**
   * Configuration options defining how the store interacts with the server.
   * Includes handlers for fetching, adding, updating, and removing data.
   */
  private options: ServerOptions<T, B>;

  /**
   * Interval timer reference used for periodic fetching,
   * created only if `options.interval` and `options.fetcher` are provided.
   */
  private timer?: ReturnType<typeof setInterval>;

  /**
   * Creates a new SynqStore instance with optional initial data and configuration.
   * 
   * @param initial - The initial value or list of values for the store.
   * @param options - Configuration options defining server interaction methods.
   * @param key - Optional unique identifier key for items in the store.
   */
  constructor(initial: T | T[] | null, options: ServerOptions<T, B>, key?: string) {
    super(initial, key);
    this.options = options;

    if (typeof window !== "undefined") {
      if (options.autoFetchOnStart) {
        this.fetch();
      }

      if (options.interval && options.fetcher) {
        this.timer = setInterval(() => this.fetch(), options.interval);
      }
    }
  }

  /**
   * Indicates whether the store is currently loading data.
   * 
   * @returns `true` if status is `"loading"`.
   */
  get isLoading() {
    return this.status === "loading";
  }

  /**
   * Indicates whether the last operation resulted in an error.
   * 
   * @returns `true` if status is `"error"`.
   */
  get isError() {
    return this.status === "error";
  }

  /**
   * Indicates whether the store is in a successful state.
   * 
   * @returns `true` if status is `"success"`.
   */
  get isSuccess() {
    return this.status === "success";
  }

  // -------------------
  // Fetch
  // -------------------

  /**
   * Fetches the latest data from the server using the configured `fetcher`.
   * Updates the store’s state with the fetched data and sets the appropriate status.
   * 
   * If the fetch fails, the store rolls back to the previous snapshot.
   */
  async fetch() {
    if (!this.options.fetcher) return;
    this.status = "loading";

    const temp = this.snapshot ? structuredClone(this.snapshot) : null;
    if (temp) this.setState(temp);

    try {
      const data = await this.options.fetcher();
      this.setState(data);
      this.status = "success";
    } catch (err) {
      console.error("Fetch failed", err);
      this.status = "error";
      if (temp) this.setState(temp);
    }
  }

  // -------------------
  // Add (single item)
  // -------------------

  /**
   * Adds a new item to the store and optionally syncs it with the server.
   * Performs optimistic updates by assigning a temporary ID.
   * 
   * @param item - The item data to add (partial allowed).
   * @param xId - Optional extra payload or context for the request.
   */
  async add(item: Partial<T>, xId?: B) {
    const tempId =
      this.options.idFactory?.() ??
      "temp-" + Math.random().toString(36).slice(2, 9);

    const optimistic = { ...item, [this.key]: tempId } as T;
    super.add(optimistic);

    if (!this.options.add) return;

    try {
      const saved = await this.options.add(item, xId);
      super.update(saved, tempId);
      this.status = "success";
    } catch (err) {
      console.error("Add failed", err);
      super.remove(tempId);
    }
  }

  // -------------------
  // Add Many
  // -------------------

  /**
   * Adds multiple items to the store and optionally syncs them with the server.
   * Supports optimistic updates by merging new items with the current snapshot.
   * 
   * @param items - The list of items to add.
   */
  async addMany(items: T[]) {
    if (Array.isArray(this.snapshot)) {
      this.setState([...this.snapshot, ...items]);
    } else if (this.snapshot === null) {
      this.setState(items);
    } else {
      this.setState([this.snapshot, ...items]);
    }

    if (!this.options.addMany) return;

    try {
      const saved = await this.options.addMany(items);
      if (Array.isArray(this.snapshot)) {
        this.setState([...this.snapshot, ...saved]);
      } else if (this.snapshot === null) {
        this.setState(saved);
      } else {
        this.setState([this.snapshot, ...saved]);
      }
      this.status = "success";
    } catch (err) {
      console.error("AddMany failed", err);
      this.status = "error";
    }
  }

  // -------------------
  // Update
  // -------------------

  /**
   * Updates an existing item in the store and optionally syncs the changes to the server.
   * 
   * @param item - The updated item data.
   */
  async update(item: T) {
    const id = (item as Record<string, unknown>)[this.key] as string;
    super.update(item, id);

    if (!this.options.update) return;

    try {
      const saved = await this.options.update(item);

      if (Array.isArray(this.snapshot)) {
        const next = this.snapshot.map((i) =>
          (i as Record<string, unknown>)[this.key] === id ? saved : i
        );
        this.setState(next);
      } else {
        this.setState(saved);
      }

      this.status = "success";
    } catch (err) {
      console.error("Update failed", err);
      this.status = "error";
    }
  }

  // -------------------
  // Remove
  // -------------------

  /**
   * Removes an item from the store and optionally deletes it on the server.
   * If the removal fails, the deleted item is restored.
   * 
   * @param id - The unique identifier of the item to remove.
   */
  async remove(id: string) {
    const backup = this.find(id);
    super.remove(id);

    if (!this.options.remove) return;

    try {
      await this.options.remove(id);
      this.status = "success";
    } catch (err) {
      console.error("Delete failed", err);
      if (backup) {
        super.add(backup);
      }
    }
  }

  // -------------------
  // Dispose
  // -------------------

  /**
   * Disposes of the store by clearing its internal timer.
   * Should be called when the store is no longer needed.
   */
  dispose() {
    if (this.timer) clearInterval(this.timer);
  }
}
