"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynqStore = void 0;
const store_1 = require("./store");
// -----------------------------
// Server-Synced Store (TanStack-like)
// -----------------------------
class SynqStore extends store_1.Store {
    constructor(initial, options, key) {
        super(initial, key);
        this.status = "idle";
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
    get isLoading() {
        return this.status === "loading";
    }
    get isError() {
        return this.status === "error";
    }
    get isSuccess() {
        return this.status === "success";
    }
    // -------------------
    // Fetch
    // -------------------
    async fetch() {
        if (!this.options.fetcher)
            return;
        this.status = "loading";
        const temp = this.snapshot ? structuredClone(this.snapshot) : null;
        if (temp)
            this.setState(temp);
        try {
            const data = await this.options.fetcher();
            this.setState(data);
            this.status = "success";
        }
        catch (err) {
            console.error("Fetch failed", err);
            this.status = "error";
            if (temp)
                this.setState(temp);
        }
    }
    // -------------------
    // Add (single item)
    // -------------------
    async add(item, xId) {
        const tempId = this.options.idFactory?.() ??
            "temp-" + Math.random().toString(36).slice(2, 9);
        const optimistic = { ...item, [this.key]: tempId };
        super.add(optimistic);
        if (!this.options.add)
            return;
        try {
            const saved = await this.options.add(item, xId);
            super.update(saved, tempId);
            this.status = "success";
        }
        catch (err) {
            console.error("Add failed", err);
            super.remove(tempId);
        }
    }
    // -------------------
    // Add Many
    // -------------------
    async addMany(items) {
        if (Array.isArray(this.snapshot)) {
            this.setState([...this.snapshot, ...items]);
        }
        else if (this.snapshot === null) {
            this.setState(items);
        }
        else {
            this.setState([this.snapshot, ...items]);
        }
        if (!this.options.addMany)
            return;
        try {
            const saved = await this.options.addMany(items);
            if (Array.isArray(this.snapshot)) {
                this.setState([...this.snapshot, ...saved]);
            }
            else if (this.snapshot === null) {
                this.setState(saved);
            }
            else {
                this.setState([this.snapshot, ...saved]);
            }
            this.status = "success";
        }
        catch (err) {
            console.error("AddMany failed", err);
            this.status = "error";
        }
    }
    // -------------------
    // Update
    // -------------------
    async update(item) {
        const id = item[this.key];
        super.update(item, id);
        if (!this.options.update)
            return;
        try {
            const saved = await this.options.update(item);
            if (Array.isArray(this.snapshot)) {
                const next = this.snapshot.map((i) => i[this.key] === id ? saved : i);
                this.setState(next);
            }
            else {
                this.setState(saved);
            }
            this.status = "success";
        }
        catch (err) {
            console.error("Update failed", err);
            this.status = "error";
        }
    }
    // -------------------
    // Remove
    // -------------------
    async remove(id) {
        const backup = this.find(id);
        super.remove(id);
        if (!this.options.remove)
            return;
        try {
            await this.options.remove(id);
            this.status = "success";
        }
        catch (err) {
            console.error("Delete failed", err);
            if (backup) {
                super.add(backup);
            }
        }
    }
    // -------------------
    // Dispose
    // -------------------
    dispose() {
        if (this.timer)
            clearInterval(this.timer);
    }
}
exports.SynqStore = SynqStore;
//# sourceMappingURL=synq_store.js.map