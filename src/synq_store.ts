import { Store } from "./store";
import { ServerOptions, SynqStoreStatus } from "./types";
// -----------------------------
// Server-Synced Store (TanStack-like)
// -----------------------------

export class SynqStore<T, B> extends Store<T> {
    status: SynqStoreStatus = "idle";
    private options: ServerOptions<T, B>;
    private timer?: ReturnType<typeof setInterval>;

    constructor(initial: T[], options: ServerOptions<T, B>, key?: string) {
        super(initial, key);
        this.options = options;
        if (typeof window !== "undefined") {
            // auto-fetch only if developer opts in
            if (options.autoFetchOnStart) {
                this.fetch();
            }

            if (options.interval && options.fetcher) {
                this.timer = setInterval(() => this.fetch(), options.interval);
            }
        }
    }

    get isLoading() {
        return this.status === "loading";
    }

    get isError() {
        return this.status === "error";
    }

    get isSuccess() {
        return this.status === "success";
    }

    async fetch() {
        if (!this.options.fetcher) return;
        this.status = "loading";
        const temp = Object.assign([], this.snapshot);
        this.setState(temp);
        try {
            const data = await this.options.fetcher();
            this.setState(data);
            this.status = "success";
        } catch (err) {
            console.error("Fetch failed", err);
            this.status = "error";
            const temp = Object.assign([], this.snapshot);
            this.setState(temp);
        }
    }

    // -------------------
    // Add (single item)
    // -------------------
    async add(item: Partial<T>, xId?: B) {
        // assign temp ID if missing
        const tempId = (this.options.idFactory?.() ??
            "temp-" + Math.random().toString(36).slice(2, 9));

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
            // this.status = "error";
        }
    }

    // -------------------
    // Add Many
    // -------------------
    async addMany(items: T[]) {
        const next = [...this.snapshot, ...items];
        this.setState(next);

        if (!this.options.addMany) return;

        try {
            const saved = await this.options.addMany(items);
            this.setState([...this.snapshot, ...saved]);
            this.status = "success";
        } catch (err) {
            console.error("AddMany failed", err);
            this.status = "error";
        }
    }

    // -------------------
    // Update
    // -------------------
    async update(item: T) {
        super.update(item, (item as Record<string, unknown>)[this.key] as string);
        if (!this.options.update) return;

        try {
            const saved = await this.options.update(item);
            this.setState(
                this.snapshot.map((i) => (i === saved ? saved : i))
            );
            this.status = "success";
        } catch (err) {
            console.error("Update failed", err);
            this.status = "error";
        }
    }


    // -------------------
    // Remove
    // -------------------
    async remove(id: string) {
        // const next = this.snapshot.filter((i) => (i as Record<string, unknown>)[this.key] !== id);
        // this.setState(next);
        const backup = super.find(id);

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
            // this.status = "error";
        }
    }
    // async sync(next: T[]) {
    //     this.setState(next); // optimistic update
    //     if (this.options.add) {
    //         try {
    //             const savedItems = await Promise.all(next.map(this.options.add));
    //             this.setState(savedItems); // reconcile with server
    //             this.status = "success";
    //         } catch (err) {
    //             console.error("Save failed", err);
    //             this.status = "error";
    //         }
    //     } else if (this.options.addMany) {
    //         try {
    //             const saved = await this.options.addMany(next);
    //             this.setState(saved); // reconcile with server
    //             this.status = "success";
    //         } catch (err) {
    //             console.error("Save failed", err);
    //             this.status = "error";
    //         }
    //     }
    // }

    dispose() {
        if (this.timer) clearInterval(this.timer);
    }
}