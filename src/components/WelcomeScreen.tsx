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
    const renderCreateGeneralIssueLink = () => {
        const question = "Do you have some feedback?";
        const callToAction = "Click here to let me know.";
        const issueTitle = `Feedback about <fill in here>`;
        const issueBody = `<fill in here>`;
        const issueUrl = getCreateIssueUrl(issueTitle, issueBody, undefined);
        return (
            <p>
                {question}{" "}
                <a target="_blank" href={issueUrl} rel="noopener noreferrer">
                    {callToAction}
                </a>
            </p>
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

    const renderCaseCheckboxes = (caseNumber: number) => {
        const caseName = ALL_CASE_NAMES[caseNumber];
        return (
            <div key={caseNumber} className="mb-1">
                <label className="cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={selectedCases.has(caseNumber)}
                        value={caseNumber}
                        onChange={getCaseClickHandler(caseNumber)}
                        aria-label={caseName}
                        className="mr-2"
                    />
                    {caseName}
                </label>
            </div>
        );
    };

    return (
        <div className="welcome-screen">
            <h1>Czech Practice</h1>
            <p className="py-2 text-[16px] leading-relaxed">
                Practise Czech grammar and declensions in this interactive app with{" "}
                <span className="font-bold">
                    {databaseNumberOfWords === undefined ? "" : databaseNumberOfWords} words
                </span>{" "}
                and{" "}
                <span className="font-bold">
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
            <div className="flex gap-0 mb-4">
                <Button onClick={handleSelectAllClick} className="rounded-r-none border-r-0">
                    Select all
                </Button>
                <Button onClick={handleDeselectAllClick} className="rounded-l-none">
                    Deselect all
                </Button>
            </div>
            <div className="py-2 text-[16px] leading-relaxed mb-4">
                {SELECTABLE_CASE_NUMBERS.map(renderCaseCheckboxes)}
            </div>

            <div className="mt-5">
                <Button variant="primary" onClick={onStart} disabled={selectedCases.size === 0}>
                    Practise
                </Button>
            </div>
        </div>
    );
};
