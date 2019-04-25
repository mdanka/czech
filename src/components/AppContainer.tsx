import * as React from "react";

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
// const SELECTABLE_CASE_NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const SELECTABLE_CASE_NUMBERS = [8, 2, 9, 3, 10, 4, 11, 5, 12, 6, 13, 7, 14];

import * as DATABASE_JSON from "../../database/words.json";
const DATABASE = DATABASE_JSON as IWordDatabase;

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
        this.state = {
            currentWord: undefined,
            currentGuess: "",
            isRevealed: false,
            selectedCases: new Set(SELECTABLE_CASE_NUMBERS.slice()),
        };
    }

    public componentDidMount() {}

    public render() {
        const { currentWord } = this.state;
        const isPlayInProgress = currentWord !== undefined;
        const numberOfWords = Object.keys(DATABASE).length;
        return (
            <div className="app">
                <h1>Czech Practice</h1>
                <p className="md-running-text">
                    <span className="md-strong">{numberOfWords} words available.</span> Source on{" "}
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
                <p className="md-running-text">{SELECTABLE_CASE_NUMBERS.map(this.renderCaseCheckboxes)}</p>
                <h3>Practise</h3>
                {!isPlayInProgress && (
                    <p className="md-running-text">
                        <button className="md-button" onClick={this.handleNewWordClick}>
                            Start
                        </button>
                    </p>
                )}
                {this.renderCurrentWord()}
            </div>
        );
    }

    private renderCaseCheckboxes = (caseNumber: number) => {
        const { selectedCases } = this.state;
        return (
            <div>
                <input
                    type="checkbox"
                    checked={selectedCases.has(caseNumber)}
                    value={caseNumber}
                    onClick={this.getCaseClickHandler(caseNumber)}
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
        return (
            <div>
                <p className="md-running-text">
                    The word <span className="md-strong">{word}</span> ({genderString})
                </p>
                <p className="md-running-text">
                    in the case <span className="md-strong">{ALL_CASE_NAMES[caseNumber]}</span> is:
                </p>
                <p className="md-running-text">
                    <input
                        className="md-right-space"
                        type="text"
                        value={currentGuess}
                        disabled={isRevealed}
                        onChange={this.handleCurrentGuessChange}
                    />
                    <button className="md-button" onClick={this.handleCheck} disabled={isRevealed}>
                        Check answer
                    </button>
                </p>
                {isRevealed && <p className="md-running-text">{resultElement}</p>}
                {isRevealed && !isCorrect && (
                    <p className="md-running-text">
                        The correct answer was <span className="md-strong">{solution}</span>.
                    </p>
                )}
                <p className="md-running-text">
                    <button className="md-button" onClick={this.handleNewWordClick}>
                        Next word
                    </button>
                </p>
            </div>
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

    // private getCreateIssueUrl = (issueTitle: string, issueBody: string) => {
    //     const issueTitleEncoded = encodeURIComponent(issueTitle);
    //     const issueBodyEncoded = encodeURIComponent(issueBody);
    //     return `https://github.com/mdanka/czech/issues/new?labels=bug&title=${issueTitleEncoded}&body=${issueBodyEncoded}`;
    // };

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
        this.setState({ selectedCases: new Set(selectedCases) });
    };

    private handleSelectAllClick = () => {
        this.setState({ selectedCases: new Set(SELECTABLE_CASE_NUMBERS.slice()) });
    };

    private handleDeselectAllClick = () => {
        this.setState({ selectedCases: new Set() });
    };

    private handleNewWordClick = () => {
        let word: ICurrentWord | undefined;
        const maxTries = 100;
        let numTries = 0;
        while (word === undefined && numTries < maxTries) {
            word = this.getRandomWord();
            numTries++;
        }
        this.setState({ currentWord: word, currentGuess: "", isRevealed: false });
    };

    private handleCheck = () => {
        this.setState({ isRevealed: true });
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
