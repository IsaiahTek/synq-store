import { Listener } from "./types";

/**
 * Base Store class supporting Collection (Array) and Single (Object) modes.
 */
export class Store<T> {
  public key: string = 'id';
  protected state: T | T[] | null = null;
  protected listeners = new Set<Listener<T | T[] | null>>();

  constructor(initial: T | T[] | null, key?: string) {
    this.state = initial;
    if (key) this.key = key;

    if (typeof window !== "undefined") {
      queueMicrotask(async () => {
        try {
          const { addStore } = await import("./synq");
          addStore(this);
        } catch (e) { /* ignore */ }
      });
    }
  }

  get snapshot(): T | T[] | null {
    return this.state;
  }

  protected get isCollection(): boolean {
    return Array.isArray(this.state);
  }

  // -------------------
  // Add
  // -------------------
  public add(item: T | Partial<T>): void {
    if (this.isCollection) {
      const list = this.state as T[];
      const id = (item as any)[this.key];
      // Prevent duplicates
      if (id !== undefined && list.some((i: any) => i[this.key] === id)) return;
      this.setState([...list, item as T]);
    } else {
      this.setState(item as T);
    }
  }

  public addMany(items: T[]): void {
    if (this.isCollection) {
      const current = this.state as T[];
      // Filter out existing items
      const newItems = items.filter(newItem => {
        const id = (newItem as any)[this.key];
        return !current.some((existing: any) => existing[this.key] === id);
      });
      this.setState([...current, ...newItems]);
    } else {
      this.setState(items);
    }
  }

  // -------------------
  // Update
  // -------------------
  public update(item: Partial<T> | ((state: T) => T), id?: string): void {
    if (this.isCollection) {
      if (!id) return;
      const list = this.state as T[];
      const index = list.findIndex((i: any) => i[this.key] === id);
      const current = index !== -1 ? list[index] : undefined;

      const next = typeof item === 'function'
        ? (item as any)(current)
        : { ...current, ...item };

      const nextList = [...list];
      if (index !== -1) nextList[index] = next;
      else nextList.push(next); // Upsert

      this.setState(nextList);
    } else {
      const current = this.state as T;
      const next = typeof item === 'function'
        ? (item as any)(current)
        : { ...current, ...item };
      this.setState(next);
    }
  }

  // -------------------
  // Remove
  // -------------------
  public remove(input: string | ((item: T) => boolean)): void {
    if (this.isCollection) {
      const list = this.state as T[];
      let nextList: T[];

      if (typeof input === 'function') {
        nextList = list.filter(item => !input(item));
      } else {
        nextList = list.filter((i: any) => i[this.key] !== input);
      }
      this.setState(nextList);
    } else {
      // Single Mode
      if (typeof input === 'function') {
        const current = this.state as T;
        if (current && input(current)) {
          this.setState(null);
        }
      } else {
        this.setState(null);
      }
    }
  }

  find(id: string): T | undefined {
    if (this.isCollection) {
      return (this.state as T[]).find((i: any) => i[this.key] === id);
    }
    return undefined;
  }

  findBy(predicate: (item: T) => boolean): T | undefined {
    if (this.isCollection) {
      return (this.state as T[]).find(predicate);
    }

    const item = this.state as T;
    return predicate(item) ? item : undefined;
  }

  findByKey<K extends keyof T>(key: K, value: T[K]): T | undefined {
    if (this.isCollection) {
      return (this.state as T[]).find(item => item[key] === value);
    }

    const item = this.state as T;
    return item[key] === value ? item : undefined;
  }


  public setState(next: T | T[] | null): void {
    if (Object.is(this.state, next)) return;
    this.state = next;
    this.listeners.forEach((l) => l(this.state));
  }

  subscribe(listener: Listener<T | T[] | null>) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}