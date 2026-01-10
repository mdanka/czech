import React, { useState, useEffect, useRef, useCallback } from "react";
import { IWordDatabase, ICurrentPuzzle, ISolutionWordParts } from "./types";
import { ALL_CASE_NAMES, CASE_PREPOSITIONS, SELECTABLE_CASE_NUMBERS } from "./constants";
import { IScores } from "./LocalData";
import {
    selectRandom,
    wordInfoToCaseList,
    generateGenderString,
    normalizeString,
    getWiktionaryUrl,
    getCreateIssueUrl,
    getSolutionsWordParts,
} from "./utils";
import { Button } from "./Button";
import { GenderIcon } from "./GenderIcon";

interface IPracticeScreenProps {
    database: IWordDatabase;
    selectedCases: Set<number>;
    onBack: () => void;
    scores: IScores;
    increaseScore: (type: keyof IScores) => Promise<void>;
    resetScores: () => Promise<void>;
}

export const PracticeScreen: React.FC<IPracticeScreenProps> = ({
    database,
    selectedCases,
    onBack,
    scores,
    increaseScore,
    resetScores,
}) => {
    const [currentPuzzle, setCurrentPuzzle] = useState<ICurrentPuzzle | undefined>(undefined);
    const [currentGuess, setCurrentGuess] = useState<string>("");
    const [isRevealed, setIsRevealed] = useState<boolean>(false);
    const [isTooltipVisible, setIsTooltipVisible] = useState<boolean>(false);

    const practiceInputRef = useRef<HTMLInputElement>(null);
    const practiceNextWordButtonRef = useRef<HTMLButtonElement>(null);

    const focusOnRef = useCallback((refObject: React.RefObject<HTMLElement | HTMLInputElement | HTMLButtonElement | null>) => {
        const element = refObject.current;
        if (element === null) {
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

    const getRandomPuzzle = useCallback((): ICurrentPuzzle | undefined => {
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
    }, [database, selectedCases]);

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
        // We need to wait for render to focus, so we wait a bit.
        // setTimeout works if elements don't unmount/remount unexpectedly, which here they don't.
        // Alternative: useEffect dependent on currentPuzzle.
        setTimeout(focusOnPracticeInput, 0);

        if (isSkipped) {
            await increaseScore("skipped");
        }
    }, [getRandomPuzzle, increaseScore, focusOnPracticeInput]);

    const tooltipRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        if (!currentPuzzle) {
            void handleNewWordClick(false);
        }
    }, [currentPuzzle, handleNewWordClick]);

    // Handle tooltip outside click
    useEffect(() => {
        const handleClickOutside = (event: PointerEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setIsTooltipVisible(false);
            }
        };

        if (isTooltipVisible) {
            document.addEventListener("pointerdown", handleClickOutside as EventListener);
        } else {
            document.removeEventListener("pointerdown", handleClickOutside as EventListener);
        }

        return () => {
            document.removeEventListener("pointerdown", handleClickOutside as EventListener);
        };
    }, [isTooltipVisible]);

    const isGuessCorrect = useCallback((): boolean => {
        if (currentPuzzle == null) {
            return false;
        }
        const normalizedGuess = normalizeString(currentGuess);
        const { solutions } = currentPuzzle;
        const normalizedSolutions = solutions.map(normalizeString);
        return normalizedSolutions.indexOf(normalizedGuess) !== -1;
    }, [currentPuzzle, currentGuess]);

    const handleCheck = useCallback(() => {
        setIsRevealed(true);
        const guessResult = isGuessCorrect();
        void increaseScore(guessResult ? "correct" : "wrong");
        setTimeout(focusOnNextWordButton, 0);
    }, [increaseScore, focusOnNextWordButton, isGuessCorrect]);

    const handleCurrentGuessChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentGuess(event.target.value);
    }, []);

    const getHandlerIfEnter = useCallback((handler: () => void) => (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handler();
        }
    }, []);

    const handleSkipClick = useCallback(() => {
        void handleNewWordClick(!isRevealed);
    }, [handleNewWordClick, isRevealed]);

    const handleResetScoresClick = useCallback(() => {
        void resetScores();
    }, [resetScores]);

    const renderScores = () => {
        const { correct, wrong, skipped } = scores;
        return (
            <div className="flex items-center justify-center gap-4 text-[13px] text-text-subtle">
                <span>
                    <span className="text-success">{correct} correct</span>,{" "}
                    <span className="text-danger">{wrong} wrong</span>,{" "}
                    {skipped} skipped
                </span>
                <Button size="tiny" onClick={handleResetScoresClick}>
                    Reset
                </Button>
            </div>
        );
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

        const issueUrl = getCreateIssueUrl(issueTitle, issueBody, "word");
        return (
            <div className="text-[12px] text-text-subtle mt-4 text-center">
                <div>{question}</div>
                <a target="_blank" href={issueUrl} rel="noopener noreferrer">
                    {callToAction}
                </a>
            </div>
        );
    };

    const renderSolutionWordParts = (solutionWordParts: ISolutionWordParts, index: number) => {
        const { beginning, ending } = solutionWordParts;
        return (
            <span key={beginning + ending}>
                {index > 0 ? " " : ""}
                {beginning}
                <span className="font-bold text-text-main">{ending}</span>
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

    const renderCurrentPuzzle = () => {
        if (currentPuzzle == null) {
            return null;
        }
        const { word, solutions, caseNumber, info } = currentPuzzle;
        const { gender, isAnimated } = info;
        const genderString = generateGenderString(gender, isAnimated);
        const isCorrect = isGuessCorrect();

        const genderColorClass = gender === "f" ? "text-feminine" : gender === "m" ? "text-masculine" : "text-neutrum";

        const resultElement = isCorrect ? (
            <div className="text-[20px] font-bold text-success">✓ Correct!</div>
        ) : (
            <div className="text-[20px] font-bold text-danger">✗ Incorrect</div>
        );
        const solutionsPartsList = getSolutionsWordParts(word, solutions);
        const casePreposition = CASE_PREPOSITIONS[caseNumber];
        const caseName = ALL_CASE_NAMES[caseNumber];

        return (
            <div className="flex flex-col gap-4 py-4 w-full">
                <div className="flex flex-col items-center">
                    <span className="text-[14px]">The word</span>
                    <span className={`${genderColorClass} text-[32px] font-bold leading-tight text-center`}>{word}</span>
                    <div className="flex items-center gap-1.5">
                        <GenderIcon gender={gender} isAnimated={isAnimated} className="text-[14px]" />
                        <span className={`${genderColorClass} text-[14px] text-center`}>{genderString}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <span className="text-[14px]">in the case</span>
                    <span className="text-[20px] font-semibold text-center">{caseName}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <span className="text-[14px]">is:</span>
                    <div className="flex items-center w-full gap-3">
                        {casePreposition && <span className="text-[20px] whitespace-nowrap">{casePreposition}</span>}
                        <input
                            className="flex-1 px-4 py-2 border border-border text-[20px] leading-normal disabled:opacity-95 disabled:bg-[#f2f2f2] focus:outline-none focus:border-primary transition-colors"
                            type="text"
                            value={currentGuess}
                            disabled={isRevealed}
                            onChange={handleCurrentGuessChange}
                            onKeyPress={getHandlerIfEnter(handleCheck)}
                            ref={practiceInputRef}
                            aria-label="Current guess"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                    </div>
                </div>

                <div className="flex flex-row gap-2 mt-2 w-full">
                    <Button
                        variant="primary"
                        onClick={handleCheck}
                        disabled={isRevealed}
                        className="flex-2 justify-center py-4 text-[16px]"
                    >
                        Check answer
                    </Button>
                    <Button
                        onClick={handleSkipClick}
                        ref={practiceNextWordButtonRef}
                        className="flex-1 justify-center py-4 text-[16px]"
                    >
                        Next
                    </Button>
                </div>

                {isRevealed && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                        {resultElement}
                        <div className="text-[14px] text-center">
                            The correct answer was
                        </div>
                        <div className="text-[20px] text-center text-text-subtle">
                            &apos;{casePreposition} {solutionsPartsList.map(renderSolutionsParts)}&apos;
                        </div>
                    </div>
                )}
                {isRevealed && renderCreateWordIssueLink()}
            </div>
        );
    };

    const toggleTooltip = () => {
        setIsTooltipVisible(!isTooltipVisible);
    };

    const renderTooltip = () => {
        if (!isTooltipVisible) {
            return null;
        }
        const sortedSelectedCases = Array.from(selectedCases).sort((a, b) => {
            return SELECTABLE_CASE_NUMBERS.indexOf(a) - SELECTABLE_CASE_NUMBERS.indexOf(b);
        });
        return (
            <div className="absolute top-full left-0 bg-[rgba(0,0,0,0.9)] text-white p-[10px] rounded-[4px] z-[100] whitespace-nowrap mt-[5px] shadow-[0_2px_10px_rgba(0,0,0,0.5)] text-[0.85em] max-h-[300px] overflow-y-auto border border-[rgba(255,255,255,0.1)]">
                <ul style={{ margin: 0, padding: 0, listStyleType: "none", textAlign: "left" }}>
                    {sortedSelectedCases.map(caseNumber => (
                        <li key={caseNumber} style={{ marginBottom: "4px" }}>
                            {ALL_CASE_NAMES[caseNumber]}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="practice-screen flex flex-col gap-4 py-4 max-w-[400px] mx-auto">
            <div className="flex justify-between items-center w-full">
                <Button onClick={onBack}>
                    &larr; Settings
                </Button>
                <div
                    className="relative inline-block"
                    ref={tooltipRef}
                    onClick={toggleTooltip}
                >
                    <span className="cursor-pointer underline decoration-dotted text-text-subtle text-[0.9em] hover:text-text-main transition-colors">
                        {selectedCases.size} cases selected
                    </span>
                    {renderTooltip()}
                </div>
            </div>

            <div className="w-full">
                {renderScores()}
            </div>

            <div className="min-h-[300px] flex flex-col items-center w-full">
                {renderCurrentPuzzle()}
            </div>
        </div>
    );
};
