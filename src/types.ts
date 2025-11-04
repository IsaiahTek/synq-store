export type SynqStoreStatus = "idle" | "loading" | "error" | "success";

export type StoreType = Record<string, any>;

// export type StoreType = StoreObject | StoreObject [] 

export type ServerOptions<T, B> = {
    fetcher?: () => Promise<T[]>;
    add?: (item: Partial<T>, extra?: Partial<B>) => Promise<T>;
    update?: (item: Partial<T>) => Promise<T>;
    remove?: (id: string) => Promise<void>;
    addMany?: (items: Partial<T>[]) => Promise<T[]>;
    interval?: number;
    autoFetchOnStart?: boolean;
    idFactory?: () => string; // optional: how to generate temp IDs
};

export type Store<T> = {
  readonly snapshot: T;
  setState(next: T): void;
  subscribe(listener: Listener<T>): () => void;
};

export type Listener<T> = (state: T) => void;

export type SynqStore<T extends { id: string }> = Store<T[]> & {
  status: SynqStoreStatus;

  fetch(): Promise<void>;

  add(item: Partial<T>): Promise<void>;
  addMany(items: T[]): Promise<void>;
  update(item: T): Promise<void>;
  remove(id: string): Promise<void>;

  dispose(): void;
};
