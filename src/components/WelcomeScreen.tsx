import React, { useCallback } from "react";
import { ALL_CASE_NAMES, SELECTABLE_CASE_NUMBERS } from "./constants";
import { getCreateIssueUrl } from "./utils";

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
        const callToAction = "Click here to let us know.";
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

    return (
        <div className="welcome-screen">
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

            <p className="md-running-text" style={{ marginTop: "20px" }}>
                <button className="md-button md-intent-primary" onClick={onStart} disabled={selectedCases.size === 0}>
                    Practise
                </button>
            </p>
        </div>
    );
};
