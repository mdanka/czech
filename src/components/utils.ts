import { ICase, IGender, ISolutionWordParts, IWordInformation } from "./types";

export const SUM_REDUCER = (accumulator: number, currentValue: number) => accumulator + currentValue;

export const generateGenderString = (gender: IGender | null, isAnimated: boolean): string => {
    if (gender == null) {
        return "";
    }
    if (gender === "f") {
        return "Feminine";
    }
    if (gender === "n") {
        return "Neuter";
    }
    if (isAnimated) {
        return "Masculine - animate";
    }
    return "Masculine - inanimate";
};

export const normalizeString = (value: string): string => {
    return value.trim().toLowerCase();
};

export const selectRandom = <T>(list: T[]): T | undefined => {
    if (list.length === 0) {
        return undefined;
    }
    const index = Math.floor(Math.random() * list.length);
    return list[index];
};

export const caseToString = (caseObject: ICase | null, isSingular: boolean): string[] => {
    const caseStringOrNull = caseObject == null ? null : isSingular ? caseObject.singular : caseObject.plural;
    return caseStringOrNull == null ? [] : caseStringOrNull;
};

export const wordInfoToCaseList = (info: IWordInformation): string[][] => {
    const { nominative, genitive, dative, accusative, vocative, locative, instrumental } = info;
    return [
        [],
        caseToString(nominative, true),
        caseToString(genitive, true),
        caseToString(dative, true),
        caseToString(accusative, true),
        caseToString(vocative, true),
        caseToString(locative, true),
        caseToString(instrumental, true),
        caseToString(nominative, false),
        caseToString(genitive, false),
        caseToString(dative, false),
        caseToString(accusative, false),
        caseToString(vocative, false),
        caseToString(locative, false),
        caseToString(instrumental, false),
    ];
};

export const getWiktionaryUrl = (word: string): string => {
    return `https://cs.wiktionary.org/wiki/${word}`;
};

export const getCreateIssueUrl = (issueTitle: string, issueBody: string, label: string | undefined): string => {
    const issueTitleEncoded = encodeURIComponent(issueTitle);
    const issueBodyEncoded = encodeURIComponent(issueBody);
    const labelParam = label === undefined ? "" : `labels=${label}&`;
    return `https://github.com/mdanka/czech/issues/new?${labelParam}title=${issueTitleEncoded}&body=${issueBodyEncoded}`;
};

export const getSolutionWordPartsForWord = (original: string, solution: string): ISolutionWordParts => {
    let differenceStartIndex = 0;
    let isSubset = false;
    while (differenceStartIndex < original.length) {
        if (differenceStartIndex >= solution.length) {
            isSubset = true;
        }
        const originalChar = original[differenceStartIndex];
        const solutionChar = solution[differenceStartIndex];
        if (originalChar !== solutionChar) {
            break;
        }
        differenceStartIndex++;
    }
    if (isSubset) {
        return {
            beginning: solution,
            ending: " + ø",
        };
    }
    return {
        beginning: solution.substring(0, differenceStartIndex),
        ending: solution.substring(differenceStartIndex),
    };
};

export const getSolutionWordParts = (original: string, solution: string): ISolutionWordParts[] => {
    const originalWords = original.split(" ").map(value => value.trim());
    const solutionWords = solution.split(" ").map(value => value.trim());
    if (originalWords.length !== solutionWords.length) {
        return [{ beginning: solution, ending: "" }];
    }
    return originalWords.map((originalWord, index) => {
        const solutionWord = solutionWords[index];
        return getSolutionWordPartsForWord(originalWord, solutionWord);
    });
};

export const getSolutionsWordParts = (original: string, solutions: string[]): ISolutionWordParts[][] => {
    return solutions.map(solution => getSolutionWordParts(original, solution));
};
