// -----------------------------

// import { addStore } from "./synq";
import { Listener } from "./types";

// -----------------------------

export class Store<StoreType> {
  public key: string = 'id'
  private state: StoreType | StoreType[] | null;
  private listeners = new Set<Listener<StoreType | StoreType[]>>();

  constructor(initial: StoreType | StoreType[] | null, key?: string) {
    this.state = initial;
    if (key) {
      this.key = key
    }
    queueMicrotask(async () => {
      // import("./synq").then(({ addStore }) => addStore(this));
      const { addStore } = await import("./synq");
      addStore(this);
    });
  }

  get snapshot(): StoreType | StoreType[] | null {
    return this.state;
  }

  public add(item: StoreType): void {
    if(Array.isArray(this.snapshot)){
      const id = (item as Record<string, unknown>)[this.key];
      const existingIndex = (Array.isArray(this.snapshot)?this.snapshot:[this.snapshot]).findIndex((i) => (i as Record<string, unknown>)[this.key] === id);
      if(existingIndex !== -1) return
      this.setState([...this.snapshot, item]);
    }else{
      this.setState(item);
    }
  }

  private get isStoreArray(): boolean {
    return Array.isArray(this.state);
  }

  public update(item: StoreType | ((state: StoreType) => StoreType), key: string): void {
    if(this.isStoreArray){
      const index = this._indexOf(key);
      const current = index !== -1 ? (this.state as StoreType[])[index] : undefined;
  
      const next =
        typeof item === "function"
          ? (item as (state: StoreType | undefined) => StoreType)(current)
          : item;
  
      const newState = [...this.state as StoreType[]];
  
      if (index !== -1) newState[index] = next;
      else newState.push(next);
  
      this.state = newState;
    }else{
      const next =
        typeof item === "function"
          ? (item as (state: StoreType | undefined) => StoreType)(this.state as StoreType)
          : item;
  
      this.state = next;
    }
    if(this.state !== null){
      this.listeners.forEach((listener) => listener(this.state!));
    }
  }



  public remove(key: string) {
    if(this.isStoreArray){
      const newState = (this.snapshot as StoreType[]).filter((snap) => (snap as Record<string, unknown>)[this.key] !== key)
      this.setState(newState)
    }
  }

  private _indexOf(id: unknown) : number {
    return (Array.isArray(this.snapshot)?this.snapshot:[]).findIndex((i) => ((i as Record<string, unknown>)[this.key]) === id);
  }

  find(id: unknown) {
    if(this.isStoreArray){
      return (this.snapshot as StoreType[]).find((i) => ((i as Record<string, unknown>)[this.key]) === id);
    }
  }

  findBy(predicate: (item: StoreType) => boolean) {
    if(this.isStoreArray){
      return (this.snapshot as StoreType[]).find(predicate);
    }
  }

  /** Replace state and notify subscribers */
  public setState(next: StoreType | StoreType[]): void {
    if (Object.is(this.state, next)) return; // prevent redundant updates
    this.state = next;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  subscribe(listener: Listener<StoreType | StoreType[]>) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

}


// import { Listener } from "./types";

// export class Store<StoreType> {
//   private state: StoreType;
//   private listeners = new Set<Listener<StoreType>>();
//   public key: string = 'id';
//   private batching = false;
//   private dirty = false;

//   constructor(initial: StoreType = [], key?: string) {
//     this.state = [...initial];
//     if (key) {
//       this.key = key
//     }

//     queueMicrotask(async () => {
//       const { addStore } = await import("./synq");
//       addStore(this);
//     });
//   }

//   /** Returns current immutable snapshot */
//   get snapshot(): StoreType {
//     // Return a shallow copy for safety, so external code can’t mutate internal state
//     return [...this.state];
//   }


//   /** Add new item (immutable update) */
//   add(item: StoreType): void {
//     this.setState([...this.state, item]);
//   }

//   /** Update item by key (immutable update) */
//   update(item: StoreType): void {
//     const id = item[this.key];
//     if (id === undefined) return;

//     const index = this._indexOf(id);
//     if (index === -1) return;

//     const newState = [...this.state];
//     newState[index] = item;
//     this.setState(newState);
//   }

//   /** Remove item by key (immutable update) */
//   remove(id: StoreType[keyof StoreType]): void {
//     const newState = this.state.filter((i) => i[this.key] !== id);
//     this.setState(newState);
//   }

//   /** Find item by key */
//   find(id: StoreType[keyof StoreType]): StoreType | undefined {
//     return this.state.find((i) => i[this.key] === id);
//   }

//   /** Find by custom predicate */
//   findBy(predicate: (item: StoreType) => boolean): StoreType | undefined {
//     return this.state.find(predicate);
//   }

//   /** Subscribe to state changes */
//   subscribe(listener: Listener<StoreType>): () => void {
//     this.listeners.add(listener);
//     return () => this.listeners.delete(listener);
//   }

//   /** Begin a batch update (no re-render until commit) */
//   beginBatch(): void {
//     this.batching = true;
//     this.dirty = false;
//   }

//   /** End batch update (triggers re-render once if needed) */
//   endBatch(): void {
//     this.batching = false;
//     if (this.dirty) {
//       this.notify();
//       this.dirty = false;
//     }
//   }

//   /** Perform batch operations with automatic handling */
//   batch(fn: () => void): void {
//     this.beginBatch();
//     try {
//       fn();
//     } finally {
//       this.endBatch();
//     }
//   }

//   /** Replace state and notify subscribers */
//   private setState(next: StoreType): void {
//     if (Object.is(this.state, next)) return;

//     this.state = next;
//     if (this.batching) {
//       this.dirty = true;
//     } else {
//       this.notify();
//     }
//   }

//   /** Notify all listeners */
//   private notify(): void {
//     for (const listener of this.listeners) {
//       listener(this.state);
//     }
//   }

//   /** Utility: find index by id */
//   private _indexOf(id: unknown): number {
//     return this.state.findIndex((i) => i[this.key] === id);
//   }
// }
