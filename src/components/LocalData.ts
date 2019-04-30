export interface ILocalData {
    version: 1;
    stats: {
        correct: number;
        wrong: number;
        skipped: number;
    };
    settings: {
        selectedCases: Set<number>;
    };
}

export class LocalData {
    private static KEY = "CZECH_APP_LOCAL_DATA";
    private static CURRENT_VERSION = 1 as 1;
    private static DEFAULT_LOCAL_DATA: ILocalData = {
        version: LocalData.CURRENT_VERSION,
        stats: {
            correct: 0,
            wrong: 0,
            skipped: 0,
        },
        settings: {
            selectedCases: new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
        },
    };

    public loadLocalData = (): ILocalData => {
        const localDataString = window.localStorage.getItem(LocalData.KEY);
        if (localDataString === null) {
            return LocalData.DEFAULT_LOCAL_DATA;
        }
        const localDataJson = JSON.parse(localDataString);
        if (this.isLocalData(localDataJson)) {
            return localDataJson;
        }
        return LocalData.DEFAULT_LOCAL_DATA;
    };

    public saveLocalData = (localData: ILocalData) => {
        window.localStorage.setItem(LocalData.KEY, JSON.stringify(localData));
    };

    private isLocalData(json: any): json is ILocalData {
        return json && json.version === LocalData.CURRENT_VERSION;
    }
}
