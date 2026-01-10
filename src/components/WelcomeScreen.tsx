import React, { useCallback } from "react";
import { ALL_CASE_NAMES, SELECTABLE_CASE_NUMBERS } from "./constants";
import { getCreateIssueUrl } from "./utils";
import { Button } from "./Button";

interface IWelcomeScreenProps {
    selectedCases: Set<number>;
    setSelectedCases: (cases: Set<number>) => void;
    onStart: () => void;
    databaseNumberOfWords: number | undefined;
    databaseNumberOfDeclensions: number | undefined;
}

export const WelcomeScreen: React.FC<IWelcomeScreenProps> = ({
    selectedCases,
    setSelectedCases,
    onStart,
    databaseNumberOfWords,
    databaseNumberOfDeclensions,
}) => {
    const renderFooter = () => {
        const question = "Do you have feedback?";
        const callToAction = "Click here to let me know.";
        const issueTitle = `Feedback about <fill in here>`;
        const issueBody = `<fill in here>`;
        const issueUrl = getCreateIssueUrl(issueTitle, issueBody, undefined);
        return (
            <footer className="mt-12 pt-6 border-t border-border/30 text-center text-text-subtle text-sm">
                <p className="mb-4">
                    {question}{" "}
                    <a target="_blank" href={issueUrl} rel="noopener noreferrer" className="font-medium">
                        {callToAction}
                    </a>
                </p>
                <div className="flex justify-center gap-4">
                    <a href="https://github.com/mdanka/czech" target="_blank" rel="noopener noreferrer">
                        Github Source
                    </a>
                    <span className="text-border">|</span>
                    <a href="https://miklosdanka.com" target="_blank" rel="noopener noreferrer">
                        My other projects
                    </a>
                </div>
            </footer>
        );
    };

    const handleSelectAllClick = useCallback(() => {
        setSelectedCases(new Set(SELECTABLE_CASE_NUMBERS.slice()));
    }, [setSelectedCases]);

    const handleDeselectAllClick = useCallback(() => {
        setSelectedCases(new Set());
    }, [setSelectedCases]);

    const getCaseClickHandler = useCallback(
        (caseNumber: number) => () => {
            const newSelectedCases = new Set(selectedCases);
            if (newSelectedCases.has(caseNumber)) {
                newSelectedCases.delete(caseNumber);
            } else {
                newSelectedCases.add(caseNumber);
            }
            setSelectedCases(newSelectedCases);
        },
        [selectedCases, setSelectedCases]
    );

    const renderCaseToggle = (caseNumber: number) => {
        const caseName = ALL_CASE_NAMES[caseNumber];
        const isSelected = selectedCases.has(caseNumber);
        return (
            <button
                key={caseNumber}
                type="button"
                onClick={getCaseClickHandler(caseNumber)}
                className={`
                    px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium cursor-pointer
                    ${isSelected
                        ? "bg-primary text-white border-primary shadow-md transform scale-105"
                        : "bg-white text-text-main border-border hover:border-primary/50"
                    }
                `}
            >
                {caseName}
            </button>
        );
    };

    return (
        <div className="welcome-screen max-w-2xl mx-auto px-4 py-8">
            <header className="mb-10 text-center">
                <h1 className="mb-4 bg-linear-to-r from-primary to-[#54b1ed] bg-clip-text text-transparent font-bold">
                    Czech Practice
                </h1>
                <p className="text-lg text-text-subtle leading-relaxed">
                    Master Czech grammar and declensions through focused practice.
                </p>
            </header>

            <section className="mb-10 grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-border/50 shadow-sm text-center">
                    <div className="text-2xl font-bold text-primary">
                        {databaseNumberOfWords === undefined ? "--" : databaseNumberOfWords.toLocaleString()}
                    </div>
                    <div className="text-xs uppercase tracking-wider text-text-subtle font-semibold mt-1">
                        Words
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-border/50 shadow-sm text-center">
                    <div className="text-2xl font-bold text-primary">
                        {databaseNumberOfDeclensions === undefined ? "--" : databaseNumberOfDeclensions.toLocaleString()}
                    </div>
                    <div className="text-xs uppercase tracking-wider text-text-subtle font-semibold mt-1">
                        Declensions
                    </div>
                </div>
            </section>

            <section className="mb-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="m-0! text-xl">Cases to practise</h3>
                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            onClick={handleSelectAllClick}
                            className="py-1 px-3 text-xs"
                        >
                            Select all
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleDeselectAllClick}
                            className="py-1 px-3 text-xs"
                        >
                            Clear
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-8">
                    {SELECTABLE_CASE_NUMBERS.map(renderCaseToggle)}
                </div>

                <div className="flex justify-center">
                    <Button
                        variant="primary"
                        onClick={onStart}
                        disabled={selectedCases.size === 0}
                        className="px-10 py-4 text-lg rounded-2xl shadow-lg transition-transform hover:scale-105"
                    >
                        Start Practising
                    </Button>
                </div>
            </section>

            {renderFooter()}
        </div>
    );
};
