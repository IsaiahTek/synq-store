import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SynqStore } from '../src/synq_store';
import { ServerOptions } from "../src/types";
import { clearAllStores, emptyStore, addStore } from "../src/synq";


// Mock helper to simulate async delay
function delay<T>(value: T, ms = 10): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

interface Todo {
    id: string;
    title: string;
    completed?: boolean;
}

describe("SynqStore", () => {
    let store: SynqStore<Todo, string>;
    let mockOptions: ServerOptions<Todo, string>;

    beforeEach(() => {
        mockOptions = {
            fetcher: vi.fn(() => delay([{ id: "1", title: "Test todo" }])),
            add: vi.fn((item) => delay({ ...item, id: "server-1" } as Todo)),
            update: vi.fn((item) => delay(item)),
            remove: vi.fn((id) => delay(undefined)),
            addMany: vi.fn((items) =>
                delay(items.map((i: Todo, idx: number) => ({ ...i, id: `server-${idx}` })))
            ),
            interval: 3000,
            autoFetchOnStart: false,
        };

        store = new SynqStore<Todo, string>([], mockOptions, "id");
        store.dispose();
    });

    afterEach(() => {
        store.dispose();
        clearAllStores();
        emptyStore(store);
        vi.clearAllMocks();
    });

    // ------------------------------------
    // Initialization
    // ------------------------------------
    it("initializes with empty array", () => {
        expect(store.snapshot).toEqual([]);
        expect(store.isSuccess).toBe(false);
    });

    it("initializes with single object", () => {
        const singleStore = new SynqStore<Todo, string>(
            [{ id: "1", title: "A" }],
            mockOptions
        );
        expect(singleStore.snapshot).toEqual([{ id: "1", title: "A" }]);
    });

    // ------------------------------------
    // Fetch
    // ------------------------------------
    it("fetch() updates state and sets success", async () => {
        await store.fetch();
        expect(store.snapshot).toEqual([{ id: "1", title: "Test todo" }]);
        expect(store.isSuccess).toBe(true);
        expect(mockOptions.fetcher).toHaveBeenCalled();
    });

    it("fetch() handles error gracefully", async () => {
        mockOptions.fetcher = vi.fn(() => Promise.reject("Network error"));
        const s = new SynqStore<Todo, string>([], mockOptions);
        await s.fetch();
        expect(s.isError).toBe(true);
    });

    // ------------------------------------
    // Add (optimistic + server sync)
    // ------------------------------------
    it("add() adds item optimistically and syncs with server", async () => {
        await store.add({ title: "New Todo" });
        const items = store.snapshot as Todo[];
        expect(items.length).toBe(1);
        expect(items[0].title).toBe("New Todo");
        expect(mockOptions.add).toHaveBeenCalled();
    });

    it("add() reverts on server failure", async () => {
        mockOptions.add = vi.fn(() => Promise.reject("Server down"));
        const s = new SynqStore<Todo, string>([], mockOptions);
        await s.add({ title: "Fail Todo" });
        expect((s.snapshot as Todo[]).length).toBe(0);
    });

    // ------------------------------------
    // Add Many
    // ------------------------------------
    it("should add multiple items with addMany()", () => {
        store.addMany([
            { id: "1", title: "a" },
            { id: "2", title: "b" },
        ]);
        const items = store.snapshot as Todo[];
        expect(items).toHaveLength(2);
        expect(items[1].title).toBe("b");
    });



    // ------------------------------------
    // Update
    // ------------------------------------
    it("update() modifies item and syncs with server", async () => {
        await store.add({ id: "x1", title: "Old" });
        await store.update({ id: "x1", title: "Updated" });
        const items = store.snapshot as Todo[];
        expect(items.find((i) => i.id === "x1")?.title).toBe("Updated");
        expect(mockOptions.update).toHaveBeenCalled();
    });

    it("update() works for single-object store", async () => {
        const s = new SynqStore<Todo, string>([{ id: "1", title: "Solo" }], mockOptions);
        await s.update({ id: "1", title: "Changed" });
        console.log("Update workss for single-object store", s.snapshot);
        expect((s.snapshot as Todo[])[0].title).toBe("Changed");
    });

    // ------------------------------------
    // Remove
    // ------------------------------------
    it("remove() deletes item and calls server", async () => {
        await store.add({ id: "r1", title: "Delete Me" });
        await store.remove("r1");
        const items = store.snapshot as Todo[];
        expect(items.find((i) => i.id === "r1")).toBeUndefined();
        expect(mockOptions.remove).toHaveBeenCalled();
    });

    it("remove() restores item on server failure", async () => {
        // make sure add completes and we capture the actual id used in the store
        await store.add({ title: "Revert Me" });
        const afterAdd = store.snapshot as Todo[];
        expect(afterAdd.length).toBeGreaterThan(0);

        // grab the real id (could be a temp id or server id depending on implementation)
        const realId = afterAdd[0].id;
        expect(realId).toBeDefined();

        // make server remove fail
        mockOptions.remove = vi.fn(() => Promise.reject("Server fail"));

        // attempt removal — since server will reject, store should restore the backup
        await store.remove(realId);

        const items = store.snapshot as Todo[];
        // The item should be present again (restored)
        expect(items.find((i) => i.id === realId)).toBeDefined();
    });


    // ------------------------------------
    // Subscription
    // ------------------------------------
    it("subscribe() receives updates when state changes", () => {
        const listener = vi.fn();
        const unsub = store.subscribe(listener);

        store.setState([{ id: "1", title: "Notify" }]);
        expect(listener).toHaveBeenCalledWith([{ id: "1", title: "Notify" }]);

        unsub();
    });
});
