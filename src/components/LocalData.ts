import { openDB, IDBPDatabase, DBSchema } from "idb";

const OBJECT_STORE_NAME = "CZECH_LOCAL_DATA";

interface CzechDb extends DBSchema {
    [OBJECT_STORE_NAME]: {
        key: string;
        value: ILocalDataV1;
    };
}

export interface ILocalDataV1 {
    scores: IScores;
    settings: {
        selectedCases: number[];
    };
}

export interface IScores {
    correct: number;
    wrong: number;
    skipped: number;
}

export class LocalData {
    public static DEFAULT_LOCAL_DATA: ILocalDataV1 = {
        scores: {
            correct: 0,
            wrong: 0,
            skipped: 0,
        },
        settings: {
            selectedCases: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        },
    };

    private static DB_NAME = "CZECH_APP_DB";
    private static KEY = "CZECH_APP_LOCAL_DATA";
    private static CURRENT_VERSION = 1 as 1;

    private dbPromise: Promise<IDBPDatabase<CzechDb>> | undefined;
    private localDataPromise: Promise<ILocalDataV1>;

    public constructor() {
        if (!("indexedDB" in window)) {
            console.error("This browser doesn't support IndexedDB, so not storing data");
            this.localDataPromise = Promise.resolve(LocalData.DEFAULT_LOCAL_DATA);
            return;
        }
        this.localDataPromise = this.loadLocalData();
    }

    public getLocalData = () => {
        return this.localDataPromise;
    };

    public setSelectedCases = async (selectedCases: Set<number>) => {
        const localData = await this.localDataPromise;
        const newLocalData = {
            ...localData,
            settings: { ...localData.settings, selectedCases: Array.from(selectedCases.values()) },
        };
        this.localDataPromise = Promise.resolve(newLocalData);
        return this.saveLocalData();
    };

    public setScores = async (scores: IScores) => {
        const localData = await this.localDataPromise;
        const newLocalData = {
            ...localData,
            scores,
        };
        this.localDataPromise = Promise.resolve(newLocalData);
        return this.saveLocalData();
    };

    private saveLocalData = async () => {
        window.localStorage.setItem(LocalData.KEY, JSON.stringify(this.localDataPromise));
        if (this.dbPromise === undefined) {
            return;
        }
        const db = await this.dbPromise;
        const localData = await this.localDataPromise;
        return db.put(OBJECT_STORE_NAME, localData, LocalData.KEY);
    };

    private loadLocalData = async (): Promise<ILocalDataV1> => {
        this.dbPromise = openDB<CzechDb>(LocalData.DB_NAME, LocalData.CURRENT_VERSION, {
            upgrade: db => {
                db.createObjectStore(OBJECT_STORE_NAME);
            },
        });
        const db = await this.dbPromise;
        const localData = await db.get(OBJECT_STORE_NAME, LocalData.KEY);
        return localData === undefined ? LocalData.DEFAULT_LOCAL_DATA : localData;
    };
}
