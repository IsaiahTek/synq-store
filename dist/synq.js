"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllStores = exports.emptyStore = exports.addStore = void 0;
const synq_store_1 = require("./synq_store");
class Synq {
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._stores = [];
    }
    static get instance() {
        if (!this._instance) {
            this._instance = new Synq();
        }
        return this._instance;
    }
    addStore(store) {
        // if(store instanceof SynqStore)
        Synq.instance._stores.push(store);
    }
    emptyStore(store) {
        const foundStore = Synq.instance._stores.find((s) => s === store);
        if (!foundStore)
            return;
        if (foundStore instanceof synq_store_1.SynqStore) {
            foundStore.status = 'idle';
        }
        foundStore.setState([]);
    }
    clearAllStores() {
        Synq.instance._stores.forEach((store) => {
            if (store instanceof synq_store_1.SynqStore) {
                store.status = 'idle';
            }
            store.setState([]);
        });
    }
}
const { addStore, emptyStore, clearAllStores } = Synq.instance;
exports.addStore = addStore;
exports.emptyStore = emptyStore;
exports.clearAllStores = clearAllStores;
//# sourceMappingURL=synq.js.map