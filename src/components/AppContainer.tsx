import * as React from "react";
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

const SELECTABLE_GENDERS = ["Masculine - animate", "Masculine - inanimate", "Feminine", "Neuter"]
const SELECTABLE_GENDER_CONDITIONS = [{gender: "m", isAnimated: true}, {gender: "m", isAnimated: false}, {gender: "f"}, {gender: "n"}]
const SUM_REDUCER = (accumulator: number, currentValue: number) => accumulator + currentValue;

interface IAppState {
    currentPuzzle: ICurrentPuzzle | undefined;
    currentGuess: string;
    isRevealed: boolean;
    /**
     * 1-7 refers to each of the singular cases.
     * 8-14 refers to each of the plural cases.
     */
    selectedCases: Set<number>;
    selectedGenders: Set<number>;
    scores: IScores;
    database: IWordDatabase | undefined;
    databaseNumberOfWords: number | undefined;
    databaseNumberOfDeclensions: number | undefined;
}

interface ICurrentPuzzle {
    word: string;
    info: IWordInformation;
    caseNumber: number;
    solutions: string[];
}

export class AppContainer extends React.PureComponent<{}, IAppState> {
    private localDataManager = new LocalData();
    private practiceInputRef = React.createRef<HTMLInputElement>();
    private practiceNextWordButtonRef = React.createRef<HTMLButtonElement>();

    public constructor(props: {}) {
        super(props);
        const { settings, scores } = LocalData.DEFAULT_LOCAL_DATA;
        this.state = {
            currentPuzzle: undefined,
            currentGuess: "",
            isRevealed: false,
            selectedCases: new Set(settings.selectedCases),
            selectedGenders: new Set(settings.selectedGenders),
            scores,
            database: undefined,
            databaseNumberOfWords: undefined,
            databaseNumberOfDeclensions: undefined,
        };
        this.loadLocalData();
        this.loadDatabase();
    }

    public render() {
        const { currentPuzzle, databaseNumberOfWords, databaseNumberOfDeclensions } = this.state;
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
                {this.renderCreateGeneralIssueLink()}
                <p>
                    App source on{" "}
                    <a href="https://github.com/mdanka/czech" target="_blank" rel="noopener">
                        Github
                    </a>
                    . See my{" "}
                    <a href="https://miklosdanka.com" target="_blank" rel="noopener">
                        other projects
                    </a>
                    .
                </p>
                <h3>Choose cases to practise</h3>
                <p className="md-running-text md-button-group">
                    <button className="md-button" onClick={this.handleSelectAllCasesClick}>
                        Select all
                    </button>
                    <button className="md-button" onClick={this.handleDeselectAllCasesClick}>
                        Deselect all
                    </button>
                </p>
                <div className="md-running-text">{SELECTABLE_CASE_NUMBERS.map(this.renderCaseCheckboxes)}</div>
                <h3>Choose genders to practise</h3>
                <p className="md-running-text md-button-group">
                    <button className="md-button" onClick={this.handleSelectAllGendersClick}>
                        Select all
                    </button>
                    <button className="md-button" onClick={this.handleDeselectAllGendersClick}>
                        Deselect all
                    </button>
                </p>
                <div className="md-running-text">{SELECTABLE_GENDERS.map(this.renderGenderCheckboxes)}</div>
                <h3>Practise</h3>
                <div className="czech-practice-container">
                    {!isPlayInProgress && (
                        <p className="md-running-text">
                            <button className="md-button" onClick={this.handleStartClick}>
                                Start
                            </button>
                        </p>
                    )}
                    {this.renderCurrentPuzzle()}
                </div>
            </div>
        );
    }

    private renderCaseCheckboxes = (caseNumber: number) => {
        const { selectedCases } = this.state;
        const caseName = ALL_CASE_NAMES[caseNumber];
        return (
            <div key={caseNumber}>
                <input
                    type="checkbox"
                    checked={selectedCases.has(caseNumber)}
                    value={caseNumber}
                    onChange={this.getCaseClickHandler(caseNumber)}
                    aria-label={caseName}
                />{" "}
                {caseName}
                <br />
            </div>
        );
    };

    private renderGenderCheckboxes = (genderLabel: string) => {
        const { selectedGenders } = this.state;
        const genderNumber = SELECTABLE_GENDERS.indexOf(genderLabel)
        return (
            <div key={genderLabel}>
                <input
                    type="checkbox"
                    checked={selectedGenders.has(genderNumber)}
                    value={genderNumber}
                    onChange={this.getGenderClickHandler(genderNumber)}
                    aria-label={genderLabel}
                />{" "}
                {genderLabel}
                <br />
            </div>
        );
    };
    private renderCurrentPuzzle = () => {
        const { currentPuzzle, currentGuess, isRevealed } = this.state;
        if (currentPuzzle == null) {
            return null;
        }
        const { word, solutions, caseNumber, info } = currentPuzzle;
        const { gender, isAnimated } = info;
        const genderString = this.generateGenderString(gender, isAnimated);
        const isCorrect = this.isGuessCorrect();
        const resultElement = isCorrect ? (
            <span className="md-strong md-intent-success">✓ Correct!</span>
        ) : (
            <span className="md-strong md-intent-danger">✗ Incorrect</span>
        );
        const solutionsPartsList = this.getSolutionsWordParts(word, solutions);
        const casePreposition = CASE_PREPOSITIONS[caseNumber];
        const caseName = ALL_CASE_NAMES[caseNumber];
        return (
            <div>
                {this.renderScores()}
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
                        ref={this.practiceInputRef}
                        aria-label="Current guess"
                    />
                    <button
                        className="md-button md-right-space md-intent-primary"
                        onClick={this.handleCheck}
                        disabled={isRevealed}
                    >
                        Check answer
                    </button>
                    <button className="md-button" onClick={this.handleSkipClick} ref={this.practiceNextWordButtonRef}>
                        Next word
                    </button>
                </p>
                {isRevealed && <p className="md-running-text">{resultElement}</p>}
                {isRevealed && (
                    <p className="md-running-text">
                        The correct answer was '{casePreposition} {solutionsPartsList.map(this.renderSolutionsParts)}'.
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
        const { currentPuzzle } = this.state;
        if (currentPuzzle === undefined) {
            return null;
        }
        const { word, info, solutions, caseNumber } = currentPuzzle;
        const caseName = ALL_CASE_NAMES[caseNumber];
        const { gender, isAnimated } = info;
        const wiktionaryUrl = this.getWiktionaryUrl(word);
        const genderString = this.generateGenderString(gender, isAnimated);
        const question = "Do you disagree with this answer?";
        const callToAction = "Click here to report an incorrect declension.";
        const issueTitle = `Wrong solution for "${word}"`;
        const issueBody = `The word [${word}](${wiktionaryUrl}) \`(${genderString})\` in the case \`${caseName}\` is specified as \`${solutions.join(
            ", ",
        )}\`, but I think it is incorrect because... <fill in why>`;
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
                <a target="_blank" href={issueUrl} rel="noopener">
                    {callToAction}
                </a>
            </p>
        );
    };

    private renderSolutionsParts = (solutionsParts: ISolutionWordParts[], index: number) => {
        return (
            <span key={JSON.stringify(solutionsParts)}>
                {index > 0 ? " / " : ""}
                {solutionsParts.map(this.renderSolutionWordParts)}
            </span>
        );
    };

    private renderSolutionWordParts = (solutionWordParts: ISolutionWordParts, index: number) => {
        const { beginning, ending } = solutionWordParts;
        return (
            <span key={beginning + ending}>
                {index > 0 ? " " : ""}
                {beginning}
                <span className="md-strong">{ending}</span>
            </span>
        );
    };

    private renderScores = () => {
        const { scores } = this.state;
        const { correct, wrong, skipped } = scores;
        return (
            <p>
                <span className="md-intent-success">{correct} correct,</span>{" "}
                <span className="md-intent-danger">{wrong} wrong,</span> {skipped} skipped -{" "}
                <a onClick={this.resetScores}>reset</a>
            </p>
        );
    };

    private loadLocalData = async () => {
        const localData = await this.localDataManager.getLocalData();
        const { settings, scores } = localData;
        this.setState({
            selectedCases: new Set(settings.selectedCases),
            selectedGenders: new Set(settings.selectedGenders),
            scores,
        });
    };

    private loadDatabase = async () => {
        const database = (await import(
            /* webpackChunkName: "database-words-json" */ "../../database/words.json"
        )) as IWordDatabase;
        const databaseNumberOfWords = Object.keys(database).length;
        const databaseNumberOfDeclensions = Object.keys(database)
            .map(word => {
                const wordInfo = database[word];
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
        this.setState({
            database,
            databaseNumberOfWords,
            databaseNumberOfDeclensions,
        });
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
        const { currentPuzzle, currentGuess } = this.state;
        if (currentPuzzle == null) {
            return false;
        }
        const normalizedGuess = this.normalizeString(currentGuess);
        const { solutions } = currentPuzzle;
        const normalizedSolutions = solutions.map(this.normalizeString);
        return normalizedSolutions.indexOf(normalizedGuess) !== -1;
    };

    private normalizeString = (value: string) => {
        return value.trim().toLowerCase();
    };

    /**
     * Finds suffix differences for each solution.
     */
    private getSolutionsWordParts = (original: string, solutions: string[]): ISolutionWordParts[][] => {
        return solutions.map(solution => this.getSolutionWordParts(original, solution));
    };

    /**
     * Find where the end of the solution word is different from the original
     * for each word in the given string.
     */
    private getSolutionWordParts = (original: string, solution: string): ISolutionWordParts[] => {
        const originalWords = original.split(" ").map(value => value.trim());
        const solutionWords = solution.split(" ").map(value => value.trim());
        if (originalWords.length !== solutionWords.length) {
            return [{ beginning: solution, ending: "" }];
        }
        return originalWords.map((originalWord, index) => {
            const solutionWord = solutionWords[index];
            return this.getSolutionWordPartsForWord(originalWord, solutionWord);
        });
    };

    /**
     * Find where the end of the solution word is different from the original.
     */
    private getSolutionWordPartsForWord = (original: string, solution: string): ISolutionWordParts => {
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

    private increaseScore = (type: keyof IScores) => {
        const { scores } = this.state;
        scores[type]++;
        this.setScores(scores);
    };

    private resetScores = () => {
        this.setScores({ correct: 0, wrong: 0, skipped: 0 });
    };

    private setSelectedCases = (selectedCases: Set<number>) => {
        this.setState({ selectedCases });
        this.localDataManager.setSelectedCases(selectedCases);
    };

     private setSelectedGenders = (selectedGenders: Set<number>) => {
        this.setState({ selectedGenders });
        this.localDataManager.setSelectedGenders(selectedGenders);
    };

    private setScores = (scores: IScores) => {
        this.setState({ scores });
        this.localDataManager.setScores(scores);
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

    private getGenderClickHandler = (genderNumber: number) => () => {
        const { selectedGenders } = this.state;
        if (selectedGenders.has(genderNumber)) {
            selectedGenders.delete(genderNumber);
        } else {
            selectedGenders.add(genderNumber);
        }
        const newSelectedGenders = new Set(selectedGenders);
        this.setSelectedGenders(newSelectedGenders);
    };

    private handleSelectAllCasesClick = () => {
        this.setSelectedCases(new Set(SELECTABLE_CASE_NUMBERS.slice()));
    };

    private handleDeselectAllCasesClick = () => {
        this.setSelectedCases(new Set());
    };

    private handleSelectAllGendersClick = () => {
        this.setSelectedGenders(new Set([0,1,2,3].slice()));
    };

    private handleDeselectAllGendersClick = () => {
        this.setSelectedGenders(new Set());
    };

    private handleNewWordClick = (isSkipped: boolean) => {
        let word: ICurrentPuzzle | undefined;
        const maxTries = 100;
        let numTries = 0;
        while (word === undefined && numTries < maxTries) {
            word = this.getRandomPuzzle();
            numTries++;
        }
        const { word: initialGuess } = word === undefined ? { word: "" } : word;
        this.setState(
            { currentPuzzle: word, currentGuess: initialGuess, isRevealed: false },
            this.focusOnPracticeInput,
        );
        if (isSkipped) {
            this.increaseScore("skipped");
        }
    };

    private handleStartClick = () => {
        this.handleNewWordClick(false);
        this.scrollToBottom();
    };

    private handleSkipClick = () => {
        const { isRevealed } = this.state;
        this.handleNewWordClick(!isRevealed);
    };

    private handleCheck = () => {
        this.setState({ isRevealed: true });
        const isGuessCorrect = this.isGuessCorrect();
        this.increaseScore(isGuessCorrect ? "correct" : "wrong");
        this.focusOnNextWordButton();
    };

    private getHandlerIfEnter = (handler: (event: any) => any) => (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key == "Enter") {
            handler(event);
        }
    };

    private focusOnNextWordButton = () => {
        this.focusOnRef(this.practiceNextWordButtonRef);
    };

    private focusOnPracticeInput = () => {
        this.focusOnRef(this.practiceInputRef);
    };

    private focusOnRef = (refObject: React.RefObject<HTMLElement>) => {
        const element = refObject.current;
        if (element === null) {
            console.error(`Tried to focus on ref, but it was null.`);
            console.error(refObject);
            return;
        }
        element.focus();
    };

    private getRandomPuzzle = (): ICurrentPuzzle | undefined => {
        const { selectedCases, selectedGenders, database } = this.state;
        if (database === undefined) {
            return;
        }
        const words = Object.keys(database);
        const word = selectedGenders.size === 4 ? this.selectRandom(words): this.selectGenderRestrictedWord(words, database, selectedGenders);
        if (word === undefined) {
            return;
        }
        const info = database[word];
        if (info == null) {
            return;
        }
        const caseNumber = this.selectRandom(Array.from(selectedCases));
        if (caseNumber === undefined) {
            return;
        }
        const cases = this.wordInfoToCaseList(info);
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
    };

    private selectRandom<T>(list: T[]): T | undefined {
        if (list.length === 0) {
            return undefined;
        }
        const index = Math.floor(Math.random() * list.length);
        return list[index];
    }

    private selectGenderRestrictedWord<T extends {}>(list: T[], database : IWordDatabase, selectedGenders: Set<number>): T | undefined {
        if (list.length === 0) {
            return undefined;
        }
        // Could possibly filter based on the gender conditions, but this avoids having to do extra work.
        var attempts = 100;
        while(attempts > 0){
            attempts--;
            const index = Math.floor(Math.random() * list.length);
            const info = database[list[index].toString()];
            // check if the word matches at least one of the selected gender criteria.
            for(var i of Array.from(selectedGenders)){
                const condition = SELECTABLE_GENDER_CONDITIONS[i]
                if(condition != null && info != null && info.gender === condition.gender){
                    if(info.gender === "m" && info.isAnimated !== condition.isAnimated){
                        continue
                    }
                    return list[index];
                }
            }
        }
        return undefined
    }

    private wordInfoToCaseList = (info: IWordInformation) => {
        const { nominative, genitive, dative, accusative, vocative, locative, instrumental } = info;
        return [
            [],
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
        return caseStringOrNull == null ? [] : caseStringOrNull;
    };

    private getWiktionaryUrl = (word: string) => {
        return `https://cs.wiktionary.org/wiki/${word}`;
    };
}
