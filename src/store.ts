// -----------------------------

// import { addStore } from "./synq";
import { Listener } from "./types";

// -----------------------------

export class Store<T> {
  public key: string = 'id'
  private state: T[];
  private listeners = new Set<Listener<T[]>>();

  constructor(initial: T[], key?: string) {
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

  get snapshot(): T[] {
    return this.state;
  }

  public add(item: T): void {
    const key = this.key;
    const id = (item as Record<string, unknown>)[key];
    const existingIndex = this.snapshot.findIndex((i) => (i as Record<string, unknown>)[key] === id);

    if (existingIndex !== -1) {
      // Replace the existing one
      this.setState(
        this.snapshot.map((i) => ((i as Record<string, unknown>)[key] === id ? item : i))
      );
    } else {
      // Add new
      this.setState([...this.snapshot, item]);
    }
  }


  public update(item: T, key: string) {
    const newState = this.snapshot.map((snap) => (snap as Record<string, unknown>)[this.key] === key ? item : snap);
    this.setState(newState)
  }

  public remove(key: string) {
    const newState = this.snapshot.filter((snap) => (snap as Record<string, unknown>)[this.key] !== key)
    this.setState(newState)
  }

  private _indexOf(id: unknown) {
    return this.state.findIndex((i) => ((i as Record<string, unknown>)[this.key]) === id);
  }

  find(id: unknown) {
    return this.state.find((i) => ((i as Record<string, unknown>)[this.key]) === id);
  }

  findBy(predicate: (item: T) => boolean) {
    return this.state.find(predicate);
  }

  /** Replace state and notify subscribers */
  public setState(next: T[]): void {
    if (Object.is(this.state, next)) return; // prevent redundant updates
    this.state = next;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  subscribe(listener: Listener<T[]>) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

}


// import { Listener } from "./types";

// export class Store<T> {
//   private state: T[];
//   private listeners = new Set<Listener<T[]>>();
//   public key: string = 'id';
//   private batching = false;
//   private dirty = false;

//   constructor(initial: T[] = [], key?: string) {
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
//   get snapshot(): T[] {
//     // Return a shallow copy for safety, so external code can’t mutate internal state
//     return [...this.state];
//   }


//   /** Add new item (immutable update) */
//   add(item: T): void {
//     this.setState([...this.state, item]);
//   }

//   /** Update item by key (immutable update) */
//   update(item: T): void {
//     const id = item[this.key];
//     if (id === undefined) return;

//     const index = this._indexOf(id);
//     if (index === -1) return;

//     const newState = [...this.state];
//     newState[index] = item;
//     this.setState(newState);
//   }

//   /** Remove item by key (immutable update) */
//   remove(id: T[keyof T]): void {
//     const newState = this.state.filter((i) => i[this.key] !== id);
//     this.setState(newState);
//   }

//   /** Find item by key */
//   find(id: T[keyof T]): T | undefined {
//     return this.state.find((i) => i[this.key] === id);
//   }

//   /** Find by custom predicate */
//   findBy(predicate: (item: T) => boolean): T | undefined {
//     return this.state.find(predicate);
//   }

//   /** Subscribe to state changes */
//   subscribe(listener: Listener<T[]>): () => void {
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
//   private setState(next: T[]): void {
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
