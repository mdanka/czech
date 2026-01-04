import React, { useState, useEffect, useRef, useCallback } from "react";
import { LocalData, IScores } from "./LocalData";

interface ICase {
    singular: string[];
    plural: string[];
}

type IGender = "m" | "f" | "n";

interface IWordInformation {
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

interface ISolutionWordParts {
    beginning: string;
    ending: string;
}

type IWordDatabase = { [word: string]: IWordInformation | null | undefined };

const ALL_CASE_NAMES = [
    "",
    "Nominative (1.) - singular",
    "Genitive (2.) - singular",
    "Dative (3.) - singular",
    "Accusative (4.) - singular",
    "Vocative (5.) - singular",
    "Locative (6.) - singular",
    "Instrumental (7.) - singular",
    "Nominative (1.) - plural",
    "Genitive (2.) - plural",
    "Dative (3.) - plural",
    "Accusative (4.) - plural",
    "Vocative (5.) - plural",
    "Locative (6.) - plural",
    "Instrumental (7.) - plural",
];
const SELECTABLE_CASE_NUMBERS = [8, 2, 9, 3, 10, 4, 11, 5, 12, 6, 13, 7, 14];
const CASE_PREPOSITIONS = [
    "",
    "to je",
    "bez",
    "k/ke",
    "vidím",
    "ahoj",
    "o",
    "s/se",
    "to jsou",
    "bez",
    "k/ke",
    "vidím",
    "ahoj",
    "o",
    "s/se",
];

const SUM_REDUCER = (accumulator: number, currentValue: number) => accumulator + currentValue;

interface ICurrentPuzzle {
    word: string;
    info: IWordInformation;
    caseNumber: number;
    solutions: string[];
}

export const AppContainer: React.FC = () => {
    const [currentPuzzle, setCurrentPuzzle] = useState<ICurrentPuzzle | undefined>(undefined);
    const [currentGuess, setCurrentGuess] = useState<string>("");
    const [isRevealed, setIsRevealed] = useState<boolean>(false);
    const [selectedCases, setSelectedCasesState] = useState<Set<number>>(new Set(LocalData.DEFAULT_LOCAL_DATA.settings.selectedCases));
    const [scores, setScoresState] = useState<IScores>(LocalData.DEFAULT_LOCAL_DATA.scores);
    const [database, setDatabase] = useState<IWordDatabase | undefined>(undefined);
    const [databaseNumberOfWords, setDatabaseNumberOfWords] = useState<number | undefined>(undefined);
    const [databaseNumberOfDeclensions, setDatabaseNumberOfDeclensions] = useState<number | undefined>(undefined);

    const practiceInputRef = useRef<HTMLInputElement>(null);
    const practiceNextWordButtonRef = useRef<HTMLButtonElement>(null);

    const localDataManager = useRef(new LocalData()).current;

    const setScores = useCallback(async (newScores: IScores) => {
        setScoresState(newScores);
        await localDataManager.setScores(newScores);
    }, [localDataManager]);

    const setSelectedCases = useCallback(async (newSelectedCases: Set<number>) => {
        setSelectedCasesState(newSelectedCases);
        await localDataManager.setSelectedCases(newSelectedCases);
    }, [localDataManager]);

    const loadLocalData = useCallback(async () => {
        const localData = await localDataManager.getLocalData();
        const { settings, scores: loadedScores } = localData;
        setSelectedCasesState(new Set(settings.selectedCases));
        setScoresState(loadedScores);
    }, [localDataManager]);

    const loadDatabase = useCallback(async () => {
        // Dynamic import for database - access .default for ES modules
        const dbModule = await import("../../database/words.json");
        const db = dbModule.default as IWordDatabase;

        const numWords = Object.keys(db).length;
        const numDeclensions = Object.keys(db)
            .map(word => {
                const wordInfo = db[word];
                if (wordInfo == null) {
                    return 0;
                }
                const { nominative, genitive, dative, accusative, vocative, locative, instrumental } = wordInfo;
                return [nominative, genitive, dative, accusative, vocative, locative, instrumental]
                    .map(
                        (wordCase): number => {
                            if (wordCase == null) {
                                return 0;
                            }
                            const { singular, plural } = wordCase;
                            return singular.length + plural.length;
                        },
                    )
                    .reduce(SUM_REDUCER, 0);
            })
            .reduce(SUM_REDUCER, 0);

        setDatabase(db);
        setDatabaseNumberOfWords(numWords);
        setDatabaseNumberOfDeclensions(numDeclensions);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                await loadLocalData();
                await loadDatabase();
            } catch (error) {
                console.error("Error loading data in useEffect:", error);
                // Optionally set an error state here
            }
        };

        void loadData(); // Call the async function, void prevents warning on this call

    }, [loadLocalData, loadDatabase]);

    const generateGenderString = useCallback((gender: IGender | null, isAnimated: boolean): string => {
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
    }, []);

    const normalizeString = useCallback((value: string): string => {
        return value.trim().toLowerCase();
    }, []);

    const isGuessCorrect = useCallback((): boolean => {
        if (currentPuzzle == null) {
            return false;
        }
        const normalizedGuess = normalizeString(currentGuess);
        const { solutions } = currentPuzzle;
        const normalizedSolutions = solutions.map(normalizeString);
        return normalizedSolutions.indexOf(normalizedGuess) !== -1;
    }, [currentPuzzle, currentGuess, normalizeString]);

    const increaseScore = useCallback(async (type: keyof IScores) => {
        const newScores = { ...scores };
        newScores[type]++;
        await setScores(newScores);
    }, [scores, setScores]);

    const focusOnRef = useCallback((refObject: React.RefObject<HTMLElement | HTMLInputElement | HTMLButtonElement | null>) => {
        const element = refObject.current;
        if (element === null) {
            console.error(`Tried to focus on ref, but it was null.`);
            console.error(refObject);
            return;
        }
        element.focus();
    }, []);

    const focusOnPracticeInput = useCallback(() => {
        focusOnRef(practiceInputRef);
    }, [focusOnRef]);

    const focusOnNextWordButton = useCallback(() => {
        focusOnRef(practiceNextWordButtonRef);
    }, [focusOnRef]);

    const selectRandom = useCallback(<T,>(list: T[]): T | undefined => {
        if (list.length === 0) {
            return undefined;
        }
        const index = Math.floor(Math.random() * list.length);
        return list[index];
    }, []);

    const caseToString = useCallback((caseObject: ICase | null, isSingular: boolean): string[] => {
        const caseStringOrNull = caseObject == null ? null : isSingular ? caseObject.singular : caseObject.plural;
        return caseStringOrNull == null ? [] : caseStringOrNull;
    }, []);

    const wordInfoToCaseList = useCallback((info: IWordInformation): string[][] => {
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
    }, [caseToString]);

    const getRandomPuzzle = useCallback((): ICurrentPuzzle | undefined => {
        if (database === undefined) {
            return;
        }
        const words = Object.keys(database);
        const word = selectRandom(words);
        if (word === undefined) {
            return;
        }
        const info = database[word];
        if (info == null) {
            return;
        }
        const caseNumber = selectRandom(Array.from(selectedCases));
        if (caseNumber === undefined) {
            return;
        }
        const cases = wordInfoToCaseList(info);
        const solutions = cases[caseNumber];
        if (solutions.length === 0) {
            return;
        }
        return {
            word,
            info,
            caseNumber,
            solutions,
        };
    }, [database, selectedCases, selectRandom, wordInfoToCaseList]);

    const handleNewWordClick = useCallback(async (isSkipped: boolean) => {
        let word: ICurrentPuzzle | undefined;
        const maxTries = 100;
        let numTries = 0;
        while (word === undefined && numTries < maxTries) {
            word = getRandomPuzzle();
            numTries++;
        }
        const { word: initialGuess } = word === undefined ? { word: "" } : word;
        setCurrentPuzzle(word);
        setCurrentGuess(initialGuess);
        setIsRevealed(false);
        focusOnPracticeInput();

        if (isSkipped) {
            await increaseScore("skipped");
        }
    }, [getRandomPuzzle, focusOnPracticeInput, increaseScore]);

    const handleSelectAllClick = useCallback(() => {
        void setSelectedCases(new Set(SELECTABLE_CASE_NUMBERS.slice()));
    }, [setSelectedCases]);

    const handleDeselectAllClick = useCallback(() => {
        void setSelectedCases(new Set());
    }, [setSelectedCases]);

    const getCaseClickHandler = useCallback((caseNumber: number) => () => {
        const newSelectedCases = new Set(selectedCases);
        if (newSelectedCases.has(caseNumber)) {
            newSelectedCases.delete(caseNumber);
        } else {
            newSelectedCases.add(caseNumber);
        }
        void setSelectedCases(newSelectedCases);
    }, [selectedCases, setSelectedCases]);

    const handleStartClick = useCallback(() => {
        void handleNewWordClick(false);
        window.scrollTo(0, document.body.scrollHeight);
    }, [handleNewWordClick]);

    const handleSkipClick = useCallback(() => {
        void handleNewWordClick(!isRevealed);
    }, [handleNewWordClick, isRevealed]);

    const handleCheck = useCallback(() => {
        setIsRevealed(true);
        const guessResult = isGuessCorrect();
        void increaseScore(guessResult ? "correct" : "wrong");
        focusOnNextWordButton();
    }, [increaseScore, focusOnNextWordButton, isGuessCorrect]);

    const handleCurrentGuessChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentGuess(event.target.value);
    }, []);

    const getHandlerIfEnter = useCallback((handler: () => void) => (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handler();
        }
    }, []);

    const handleResetScoresClick = useCallback(() => {
        void setScores({ correct: 0, wrong: 0, skipped: 0 });
    }, [setScores]);

    const getWiktionaryUrl = useCallback((word: string): string => {
        return `https://cs.wiktionary.org/wiki/${word}`;
    }, []);

    const getCreateIssueUrl = useCallback((issueTitle: string, issueBody: string, label: string | undefined): string => {
        const issueTitleEncoded = encodeURIComponent(issueTitle);
        const issueBodyEncoded = encodeURIComponent(issueBody);
        const labelParam = label === undefined ? "" : `labels=${label}&`;
        return `https://github.com/mdanka/czech/issues/new?${labelParam}title=${issueTitleEncoded}&body=${issueBodyEncoded}`;
    }, []);

    const getSolutionWordPartsForWord = useCallback((original: string, solution: string): ISolutionWordParts => {
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
    }, []);

    const getSolutionWordParts = useCallback((original: string, solution: string): ISolutionWordParts[] => {
        const originalWords = original.split(" ").map(value => value.trim());
        const solutionWords = solution.split(" ").map(value => value.trim());
        if (originalWords.length !== solutionWords.length) {
            return [{ beginning: solution, ending: "" }];
        }
        return originalWords.map((originalWord, index) => {
            const solutionWord = solutionWords[index];
            return getSolutionWordPartsForWord(originalWord, solutionWord);
        });
    }, [getSolutionWordPartsForWord]);

    const getSolutionsWordParts = useCallback((original: string, solutions: string[]): ISolutionWordParts[][] => {
        return solutions.map(solution => getSolutionWordParts(original, solution));
    }, [getSolutionWordParts]);

    const renderCaseCheckboxes = (caseNumber: number) => {
        const caseName = ALL_CASE_NAMES[caseNumber];
        return (
            <div key={caseNumber}>
                <input
                    type="checkbox"
                    checked={selectedCases.has(caseNumber)}
                    value={caseNumber}
                    onChange={getCaseClickHandler(caseNumber)}
                    aria-label={caseName}
                />{" "}
                {caseName}
                <br />
            </div>
        );
    };

    const renderSolutionWordParts = (solutionWordParts: ISolutionWordParts, index: number) => {
        const { beginning, ending } = solutionWordParts;
        return (
            <span key={beginning + ending}>
                {index > 0 ? " " : ""}
                {beginning}
                <span className="md-strong">{ending}</span>
            </span>
        );
    };

    const renderSolutionsParts = (solutionsParts: ISolutionWordParts[], index: number) => {
        return (
            <span key={JSON.stringify(solutionsParts)}>
                {index > 0 ? " / " : ""}
                {solutionsParts.map(renderSolutionWordParts)}
            </span>
        );
    };

    const renderScores = () => {
        const { correct, wrong, skipped } = scores;
        return (
            <p>
                <span className="md-intent-success">{correct} correct,</span>{" "}
                <span className="md-intent-danger">{wrong} wrong,</span> {skipped} skipped -{" "}
                <a onClick={handleResetScoresClick}>reset</a>
            </p>
        );
    };

    const renderCreateIssueLink = (
        question: string,
        callToAction: string,
        issueTitle: string,
        issueBody: string,
        label: string | undefined,
    ) => {
        const issueUrl = getCreateIssueUrl(issueTitle, issueBody, label);
        return (
            <p>
                {question}{" "}
                <a target="_blank" href={issueUrl} rel="noopener noreferrer">
                    {callToAction}
                </a>
            </p>
        );
    };

    const renderCreateGeneralIssueLink = () => {
        const question = "Do you have some feedback?";
        const callToAction = "Click here to let us know.";
        const issueTitle = `Feedback about <fill in here>`;
        const issueBody = `<fill in here>`;
        return renderCreateIssueLink(question, callToAction, issueTitle, issueBody, undefined);
    };

    const renderCreateWordIssueLink = () => {
        if (currentPuzzle === undefined) {
            return null;
        }
        const { word, info, solutions, caseNumber } = currentPuzzle;
        const caseName = ALL_CASE_NAMES[caseNumber];
        const { gender, isAnimated } = info;
        const wiktionaryUrl = getWiktionaryUrl(word);
        const genderString = generateGenderString(gender, isAnimated);
        const question = "Do you disagree with this answer?";
        const callToAction = "Click here to report an incorrect declension.";
        const issueTitle = `Wrong solution for "${word}"`;
        const issueBody = `The word [${word}](${wiktionaryUrl}) \`(${genderString})\` in the case \`${caseName}\` is specified as \`${solutions.join(", ")}\`, but I think it is incorrect because... <fill in why>`;
        return renderCreateIssueLink(question, callToAction, issueTitle, issueBody, "word");
    };

    const renderCurrentPuzzle = () => {
        if (currentPuzzle == null) {
            return null;
        }
        const { word, solutions, caseNumber, info } = currentPuzzle;
        const { gender, isAnimated } = info;
        const genderString = generateGenderString(gender, isAnimated);
        const isCorrect = isGuessCorrect();
        const resultElement = isCorrect ? (
            <span className="md-strong md-intent-success">✓ Correct!</span>
        ) : (
            <span className="md-strong md-intent-danger">✗ Incorrect</span>
        );
        const solutionsPartsList = getSolutionsWordParts(word, solutions);
        const casePreposition = CASE_PREPOSITIONS[caseNumber];
        const caseName = ALL_CASE_NAMES[caseNumber];

        return (
            <div>
                {renderScores()}
                <p className="md-running-text">
                    The word <span className="md-strong">{word}</span> ({genderString})
                </p>
                <p className="md-running-text">
                    in the case <span className="md-strong">{caseName}</span> is:
                </p>
                <p className="md-running-text">
                    <span className="md-right-space">{casePreposition}</span>
                    <input
                        className="md-right-space"
                        type="text"
                        value={currentGuess}
                        disabled={isRevealed}
                        onChange={handleCurrentGuessChange}
                        onKeyPress={getHandlerIfEnter(handleCheck)}
                        ref={practiceInputRef}
                        aria-label="Current guess"
                    />
                    <button
                        className="md-button md-right-space md-intent-primary"
                        onClick={handleCheck}
                        disabled={isRevealed}
                    >
                        Check answer
                    </button>
                    <button className="md-button" onClick={handleSkipClick} ref={practiceNextWordButtonRef}>
                        Next word
                    </button>
                </p>
                {isRevealed && <p className="md-running-text">{resultElement}</p>}
                {isRevealed && (
                    <p className="md-running-text">
                        The correct answer was &apos;{casePreposition} {solutionsPartsList.map(renderSolutionsParts)}&apos;.
                    </p>
                )}
                {isRevealed && renderCreateWordIssueLink()}
            </div>
        );
    };

    const isPlayInProgress = currentPuzzle !== undefined;
    return (
        <div className="app">
            <h1>Czech Practice</h1>
            <p className="md-running-text">
                Practise Czech grammar and declensions in this interactive app with{" "}
                <span className="md-strong">
                    {databaseNumberOfWords === undefined ? "" : databaseNumberOfWords} words
                </span>{" "}
                and{" "}
                <span className="md-strong">
                    {databaseNumberOfDeclensions === undefined ? "" : databaseNumberOfDeclensions} declensions
                </span>
                .
            </p>
            {renderCreateGeneralIssueLink()}
            <p>
                App source on{" "}
                <a href="https://github.com/mdanka/czech" target="_blank" rel="noopener noreferrer">
                    Github
                </a>
                . See my{" "}
                <a href="https://miklosdanka.com" target="_blank" rel="noopener noreferrer">
                    other projects
                </a>
                .
            </p>
            <h3>Choose cases to practise</h3>
            <p className="md-running-text md-button-group">
                <button className="md-button" onClick={handleSelectAllClick}>
                    Select all
                </button>
                <button className="md-button" onClick={handleDeselectAllClick}>
                    Deselect all
                </button>
            </p>
            <div className="md-running-text">{SELECTABLE_CASE_NUMBERS.map(renderCaseCheckboxes)}</div>
            <h3>Practise</h3>
            <div className="czech-practice-container">
                {!isPlayInProgress && (
                    <p className="md-running-text">
                        <button className="md-button" onClick={handleStartClick}>
                            Start
                        </button>
                    </p>
                )}
                {renderCurrentPuzzle()}
            </div>
        </div>
    );
};
