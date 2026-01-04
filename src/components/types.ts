export interface ICase {
    singular: string[];
    plural: string[];
}

export type IGender = "m" | "f" | "n";

export interface IWordInformation {
    gender: IGender | null;
    isAnimated: boolean;
    nominative: ICase | null;
    genitive: ICase | null;
    dative: ICase | null;
    accusative: ICase | null;
    vocative: ICase | null;
    locative: ICase | null;
    instrumental: ICase | null;
}

export interface ISolutionWordParts {
    beginning: string;
    ending: string;
}

export type IWordDatabase = { [word: string]: IWordInformation | null | undefined };

export interface ICurrentPuzzle {
    word: string;
    info: IWordInformation;
    caseNumber: number;
    solutions: string[];
}
