import * as React from "react";
import { LocalData } from "./LocalData";
import * as DATABASE_JSON from "../../database/words.json";

interface ICase {
    singular: string | null;
    plural: string | null;
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

interface ISolutionParts {
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
    "ahoy",
    "o",
    "s/se",
    "to jsou",
    "bez",
    "k/ke",
    "vidím",
    "ahoy",
    "o",
    "s/se",
];

const SUM_REDUCER = (accumulator: number, currentValue: number) => accumulator + currentValue;

const LOCAL_DATA_MANAGER = new LocalData();

const DATABASE = DATABASE_JSON as IWordDatabase;
const NUMBER_OF_WORDS = Object.keys(DATABASE).length;
const NUMBER_OF_DECLENSIONS = Object.keys(DATABASE)
    .map(word => {
        const wordInfo = DATABASE[word];
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
                    if (singular == null && plural == null) {
                        return 0;
                    }
                    if (singular != null && plural != null) {
                        return 2;
                    }
                    return 1;
                },
            )
            .reduce(SUM_REDUCER, 0);
    })
    .reduce(SUM_REDUCER, 0);

interface IAppState {
    currentWord: ICurrentWord | undefined;
    currentGuess: string;
    isRevealed: boolean;
    /**
     * 1-7 refers to each of the singular cases.
     * 8-14 refers to each of the plural cases.
     */
    selectedCases: Set<number>;
}

interface ICurrentWord {
    word: string;
    info: IWordInformation;
    caseNumber: number;
    solution: string;
}

export class AppContainer extends React.PureComponent<{}, IAppState> {
    public constructor(props: {}) {
        super(props);
        const localData = LOCAL_DATA_MANAGER.getLocalData();
        const { settings } = localData;
        this.state = {
            currentWord: undefined,
            currentGuess: "",
            isRevealed: false,
            selectedCases: new Set(settings.selectedCases),
        };
    }

    public render() {
        const { currentWord } = this.state;
        const isPlayInProgress = currentWord !== undefined;
        return (
            <div className="app">
                <h1>Czech Practice</h1>
                <p className="md-running-text">
                    <span className="md-strong">{NUMBER_OF_WORDS} words</span> with{" "}
                    <span className="md-strong">{NUMBER_OF_DECLENSIONS} declensions</span> available.
                </p>
                {this.renderCreateGeneralIssueLink()}
                <p>
                    App source on{" "}
                    <a href="https://github.com/mdanka/czech" target="_blank">
                        Github
                    </a>
                    .
                </p>
                <h3>Choose cases to practise</h3>
                <p className="md-running-text md-button-group">
                    <button className="md-button" onClick={this.handleSelectAllClick}>
                        Select all
                    </button>
                    <button className="md-button" onClick={this.handleDeselectAllClick}>
                        Deselect all
                    </button>
                </p>
                <div className="md-running-text">{SELECTABLE_CASE_NUMBERS.map(this.renderCaseCheckboxes)}</div>
                <h3>Practise</h3>
                <div className="czech-practice-container">
                    {!isPlayInProgress && (
                        <p className="md-running-text">
                            <button className="md-button" onClick={this.handleStartClick}>
                                Start
                            </button>
                        </p>
                    )}
                    {this.renderCurrentWord()}
                </div>
            </div>
        );
    }

    private renderCaseCheckboxes = (caseNumber: number) => {
        const { selectedCases } = this.state;
        return (
            <div key={caseNumber}>
                <input
                    type="checkbox"
                    checked={selectedCases.has(caseNumber)}
                    value={caseNumber}
                    onChange={this.getCaseClickHandler(caseNumber)}
                />{" "}
                {ALL_CASE_NAMES[caseNumber]}
                <br />
            </div>
        );
    };

    private renderCurrentWord = () => {
        const { currentWord, currentGuess, isRevealed } = this.state;
        if (currentWord == null) {
            return null;
        }
        const { word, solution, caseNumber, info } = currentWord;
        const { gender, isAnimated } = info;
        const genderString = this.generateGenderString(gender, isAnimated);
        const isCorrect = this.isGuessCorrect();
        const resultElement = isCorrect ? (
            <span className="md-strong md-intent-success">✓ Correct!</span>
        ) : (
            <span className="md-strong md-intent-danger">✗ Incorrect</span>
        );
        const solutionPartsList = this.getSolutionParts(word, solution);
        const casePreposition = CASE_PREPOSITIONS[caseNumber];
        const caseName = ALL_CASE_NAMES[caseNumber];
        return (
            <div>
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
                        onChange={this.handleCurrentGuessChange}
                        onKeyPress={this.getHandlerIfEnter(this.handleCheck)}
                    />
                    <button className="md-button md-right-space" onClick={this.handleCheck} disabled={isRevealed}>
                        Check answer
                    </button>
                    <button className="md-button" onClick={this.handleNewWordClick}>
                        Next word
                    </button>
                </p>
                {isRevealed && <p className="md-running-text">{resultElement}</p>}
                {isRevealed && !isCorrect && (
                    <p className="md-running-text">
                        The correct answer was '{casePreposition}
                        {solutionPartsList.map(this.renderSolutionParts)}'.
                    </p>
                )}
                {isRevealed && this.renderCreateWordIssueLink()}
            </div>
        );
    };

    private renderCreateGeneralIssueLink = () => {
        const question = "Do you have some feedback?";
        const callToAction = "Click here to let us know.";
        const issueTitle = `Feedback about <fill in here>`;
        const issueBody = `<fill in here>`;
        return this.renderCreateIssueLink(question, callToAction, issueTitle, issueBody, undefined);
    };

    private renderCreateWordIssueLink = () => {
        const { currentWord } = this.state;
        if (currentWord === undefined) {
            return null;
        }
        const { word, info, solution, caseNumber } = currentWord;
        const caseName = ALL_CASE_NAMES[caseNumber];
        const { gender, isAnimated } = info;
        const genderString = this.generateGenderString(gender, isAnimated);
        const question = "Do you disagree with this answer?";
        const callToAction = "Click here to report an incorrect declension.";
        const issueTitle = `Wrong solution for "${word}"`;
        const issueBody = `The word \`${word} (${genderString})\` in the case \`${caseName}\` is specified as \`${solution}\`, but I think it is incorrect because... <fill in why>`;
        return this.renderCreateIssueLink(question, callToAction, issueTitle, issueBody, "word");
    };

    private renderCreateIssueLink = (
        question: string,
        callToAction: string,
        issueTitle: string,
        issueBody: string,
        label: string | undefined,
    ) => {
        const issueUrl = this.getCreateIssueUrl(issueTitle, issueBody, label);
        return (
            <p>
                {question}{" "}
                <a target="_blank" href={issueUrl}>
                    {callToAction}
                </a>
            </p>
        );
    };

    private renderSolutionParts = (solutionParts: ISolutionParts) => {
        const { beginning, ending } = solutionParts;
        return (
            <span key={beginning + ending}>
                {" "}
                {beginning}
                <span className="md-strong">{ending}</span>
            </span>
        );
    };

    private generateGenderString = (gender: IGender | null, isAnimated: boolean) => {
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

    private getCreateIssueUrl = (issueTitle: string, issueBody: string, label: string | undefined) => {
        const issueTitleEncoded = encodeURIComponent(issueTitle);
        const issueBodyEncoded = encodeURIComponent(issueBody);
        const labelParam = label === undefined ? "" : `labels=${label}&`;
        return `https://github.com/mdanka/czech/issues/new?${labelParam}title=${issueTitleEncoded}&body=${issueBodyEncoded}`;
    };

    private isGuessCorrect = () => {
        const { currentWord, currentGuess } = this.state;
        if (currentWord == null) {
            return false;
        }
        const { solution } = currentWord;
        return this.normalizeString(currentGuess) === this.normalizeString(solution);
    };

    private normalizeString = (value: string) => {
        return value.trim().toLowerCase();
    };

    /**
     * Find where the end of the solution word is different from the original
     * for each word in the given string.
     */
    private getSolutionParts = (original: string, solution: string): ISolutionParts[] => {
        const originalWords = original.split(" ").map(value => value.trim());
        const solutionWords = solution.split(" ").map(value => value.trim());
        if (originalWords.length !== solutionWords.length) {
            return [{ beginning: solution, ending: "" }];
        }
        return originalWords.map((originalWord, index) => {
            const solutionWord = solutionWords[index];
            return this.getSolutionPartsForWord(originalWord, solutionWord);
        });
    };

    /**
     * Find where the end of the solution word is different from the original.
     */
    private getSolutionPartsForWord = (original: string, solution: string): ISolutionParts => {
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

    private scrollToBottom = () => {
        window.scrollTo(0, document.body.scrollHeight);
    };

    private setSelectedCases = (selectedCases: Set<number>) => {
        this.setState({ selectedCases });
        LOCAL_DATA_MANAGER.setSelectedCases(selectedCases);
    };

    private handleCurrentGuessChange = (event: React.ChangeEvent<any>) => {
        const currentGuess = event.target.value;
        this.setState({ currentGuess });
    };

    private getCaseClickHandler = (caseNumber: number) => () => {
        const { selectedCases } = this.state;
        if (selectedCases.has(caseNumber)) {
            selectedCases.delete(caseNumber);
        } else {
            selectedCases.add(caseNumber);
        }
        const newSelectedCases = new Set(selectedCases);
        this.setSelectedCases(newSelectedCases);
    };

    private handleSelectAllClick = () => {
        this.setSelectedCases(new Set(SELECTABLE_CASE_NUMBERS.slice()));
    };

    private handleDeselectAllClick = () => {
        this.setSelectedCases(new Set());
    };

    private handleNewWordClick = () => {
        let word: ICurrentWord | undefined;
        const maxTries = 100;
        let numTries = 0;
        while (word === undefined && numTries < maxTries) {
            word = this.getRandomWord();
            numTries++;
        }
        const { word: initialGuess } = word === undefined ? { word: "" } : word;
        this.setState({ currentWord: word, currentGuess: initialGuess, isRevealed: false });
    };

    private handleStartClick = () => {
        this.handleNewWordClick();
        this.scrollToBottom();
    };

    private handleCheck = () => {
        this.setState({ isRevealed: true });
    };

    private getHandlerIfEnter = (handler: () => void) => (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key == "Enter") {
            handler();
        }
    };

    private getRandomWord = (): ICurrentWord | undefined => {
        const { selectedCases } = this.state;
        const words = Object.keys(DATABASE);
        const word = this.selectRandom(words);
        if (word === undefined) {
            return;
        }
        const info = DATABASE[word];
        if (info == null) {
            return;
        }
        const caseNumber = this.selectRandom(Array.from(selectedCases));
        if (caseNumber === undefined) {
            return;
        }
        const cases = this.wordInfoToCaseList(info);
        const solution = cases[caseNumber];
        if (solution === "") {
            return;
        }
        return {
            word,
            info,
            caseNumber,
            solution,
        };
    };

    private selectRandom<T>(list: T[]): T | undefined {
        if (list.length === 0) {
            return undefined;
        }
        const index = Math.floor(Math.random() * list.length);
        return list[index];
    }

    private wordInfoToCaseList = (info: IWordInformation) => {
        const { nominative, genitive, dative, accusative, vocative, locative, instrumental } = info;
        return [
            "",
            this.caseToString(nominative, true),
            this.caseToString(genitive, true),
            this.caseToString(dative, true),
            this.caseToString(accusative, true),
            this.caseToString(vocative, true),
            this.caseToString(locative, true),
            this.caseToString(instrumental, true),
            this.caseToString(nominative, false),
            this.caseToString(genitive, false),
            this.caseToString(dative, false),
            this.caseToString(accusative, false),
            this.caseToString(vocative, false),
            this.caseToString(locative, false),
            this.caseToString(instrumental, false),
        ];
    };

    private caseToString = (caseObject: ICase | null, isSingular: boolean) => {
        const caseStringOrNull = caseObject == null ? null : isSingular ? caseObject.singular : caseObject.plural;
        return caseStringOrNull == null ? "" : caseStringOrNull;
    };
}
