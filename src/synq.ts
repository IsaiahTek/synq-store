import { SynqStore as ST } from "./synq_store";
import { Store, SynqStore } from "./types";

class Synq {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _stores: (SynqStore<any> | Store<any>)[] = []

    private constructor() { }

    private static _instance?: Synq;

    public static get instance(): Synq {
        if (!this._instance) {
            this._instance = new Synq();
        }
        return this._instance;
    }

    public addStore<T>(store: Store<T> | SynqStore<T & {id: string}>) {
        // if(store instanceof SynqStore)
        Synq.instance._stores.push(store);
    }

    public emptyStore<T>(store: SynqStore<T & {id: string}> | Store<T>) {
        const foundStore = Synq.instance._stores.find((s) => s === store);
        if(!foundStore) return;
        if(foundStore instanceof ST){
            foundStore.status = 'idle';
        }
        foundStore.setState([]);
    }

    public clearAllStores() {
        Synq.instance._stores.forEach((store) => {
            if(store instanceof ST){
                store.status = 'idle';
            }
            store.setState([])
        })
    }

}
const {addStore, emptyStore, clearAllStores} = Synq.instance;
export {addStore, emptyStore, clearAllStores};