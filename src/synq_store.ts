import { Store } from "./store";
import { ServerOptions, SynqStoreStatus } from "./types";

interface ExtendedServerOptions<T, B> extends ServerOptions<T, B> {
  mode?: 'collection' | 'single';
}

export class SynqStore<T, B> extends Store<T> {
  status: SynqStoreStatus = "idle";
  private options: ExtendedServerOptions<T, B>;
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    initial: T | T[] | null,
    options: ExtendedServerOptions<T, B>, 
    key: string = 'id'
  ) {
    super(initial, key);
    
    // FIX: Store reference directly so test mocks updates are reflected.
    this.options = options;

    if (typeof window !== "undefined") {
      if (options.autoFetchOnStart) this.fetch();
      if (options.interval && options.fetcher) {
        this.timer = setInterval(() => this.fetch(), options.interval);
      }
    }
  }

  get isSingleMode() { return this.options.mode === 'single'; }
  get isLoading() { return this.status === "loading"; }
  get isError() { return this.status === "error"; }
  get isSuccess() { return this.status === "success"; }

  // -------------------
  // Fetch
  // -------------------
  async fetch() {
    if (!this.options.fetcher) return;
    this.status = "loading";
    const temp = this.snapshot; 
    
    if (this.isSingleMode && temp) this.setState(temp);

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
  // Add
  // -------------------
  async add(item: Partial<T>, xId?: B) {
    if (this.isSingleMode) {
      const backup = this.snapshot;
      super.add(item); 
      if (!this.options.add) return;
      try {
        const saved = await this.options.add(item, xId);
        this.setState(saved);
        this.status = "success";
      } catch (err) {
        this.status = "error";
        this.setState(backup as T);
      }
      return;
    }

    // Collection Mode
    const tempId = this.options.idFactory?.() ?? "temp-" + Math.random().toString(36).slice(2, 9);
    // Use existing ID if provided (e.g. from test), otherwise tempId
    const idToUse = (item as any)[this.key] ?? tempId;
    
    const optimistic = { ...item, [this.key]: idToUse } as T;
    super.add(optimistic);

    if (!this.options.add) return;

    try {
      const saved = await this.options.add(item, xId);
      super.update(saved, idToUse); // Update temp ID with Server ID/Data
      this.status = "success";
    } catch (err) {
      super.remove(idToUse);
      this.status = "error";
    }
  }

  // -------------------
  // Add Many
  // -------------------
  async addMany(items: T[]) {
    const backup = this.isCollection && Array.isArray(this.snapshot) 
      ? [...this.snapshot] 
      : this.snapshot;

    super.addMany(items);

    if (!this.options.addMany) return;

    try {
      const saved = await this.options.addMany(items);
      if (this.isSingleMode) {
        this.setState(saved);
      } else {
        const base = Array.isArray(backup) ? backup : [];
        this.setState([...base, ...saved]); 
      }
      this.status = "success";
    } catch (err) {
      console.error("AddMany failed", err);
      this.status = "error";
      if (backup) this.setState(backup as any);
    }
  }

  // -------------------
  // Update
  // -------------------
  async update(item: Partial<T> | ((state: T) => T), key?: string) {
    const id = key ?? ((item as any)[this.key] as string);

    if (this.isSingleMode) {
      const backup = this.snapshot as T;
      super.update(item); 
      if (!this.options.update) return;

      try {
        const saved = await this.options.update(this.snapshot as T);
        this.setState(saved);
        this.status = "success";
      } catch (err) {
        this.status = "error";
        this.setState(backup);
      }
      return;
    }

    if (!id) return;
    super.update(item, id);

    if (!this.options.update) return;

    const currentItem = this.find(id);
    if (!currentItem) return;

    try {
      const saved = await this.options.update(currentItem);
      super.update(saved, id);
      this.status = "success";
    } catch (err) {
      this.status = "error";
    }
  }

  // -------------------
  // Remove
  // -------------------
  async remove(input: string | ((item: T) => boolean)) {
    // 1. Capture Backup (Reference is safe here because Store creates NEW arrays on change)
    const backup = this.snapshot;

    // 2. Identify IDs for Server Call
    let idsToRemove: string[] = [];

    if (this.isSingleMode) {
      const current = backup as any;
      if (current && current[this.key]) idsToRemove.push(current[this.key]);
    } else {
      const list = (backup as T[]) || [];
      if (typeof input === 'function') {
        idsToRemove = list.filter(input).map((i: any) => i[this.key]);
      } else {
        idsToRemove = [input];
      }
    }

    // 3. Optimistic Update
    super.remove(input as any);

    if (!this.options.remove) return;

    // 4. Server Sync
    try {
      if (this.isSingleMode) {
        await this.options.remove(idsToRemove[0] || "");
      } else {
        if (idsToRemove.length > 0) {
          await Promise.all(idsToRemove.map(id => this.options.remove!(id)));
        }
      }
      this.status = "success";
    } catch (err) {
      console.error("Delete failed:", err);
      this.status = "error";
      
      // 5. Revert
      if (backup) {
        // Explicitly cast to prevent union type errors
        this.setState(backup as any);
      }
    }
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
  }
}