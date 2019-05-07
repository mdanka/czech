export interface ILocalData {
    version: 1;
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
    private static KEY = "CZECH_APP_LOCAL_DATA";
    private static CURRENT_VERSION = 1 as 1;
    private static DEFAULT_LOCAL_DATA: ILocalData = {
        version: LocalData.CURRENT_VERSION,
        scores: {
            correct: 0,
            wrong: 0,
            skipped: 0,
        },
        settings: {
            selectedCases: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        },
    };
    private localData: ILocalData;

    public constructor() {
        this.localData = this.loadLocalData();
    }

    public getLocalData = () => {
        return this.localData;
    };

    public setSelectedCases = (selectedCases: Set<number>) => {
        this.localData = {
            ...this.localData,
            settings: { ...this.localData.settings, selectedCases: Array.from(selectedCases.values()) },
        };
        this.saveLocalData();
    };

    public setScores = (scores: IScores) => {
        this.localData = {
            ...this.localData,
            scores,
        };
        this.saveLocalData();
    };

    private saveLocalData = () => {
        window.localStorage.setItem(LocalData.KEY, JSON.stringify(this.localData));
    };

    private loadLocalData = (): ILocalData => {
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

    private isLocalData(json: any): json is ILocalData {
        return json && json.version === LocalData.CURRENT_VERSION;
    }
}
