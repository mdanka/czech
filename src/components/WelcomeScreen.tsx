import React, { useCallback } from "react";
import { ALL_FORM_NAMES, SELECTABLE_FORM_INDICES } from "./constants";
import { getCreateIssueUrl } from "./utils";
import { Button } from "./Button";

interface IWelcomeScreenProps {
    selectedForms: Set<number>;
    setSelectedForms: (forms: Set<number>) => void;
    onStart: () => void;
    databaseNumberOfWords: number | undefined;
    databaseNumberOfForms: number | undefined;
}

export const WelcomeScreen: React.FC<IWelcomeScreenProps> = ({
    selectedForms,
    setSelectedForms,
    onStart,
    databaseNumberOfWords,
    databaseNumberOfForms,
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
        setSelectedForms(new Set(SELECTABLE_FORM_INDICES.slice()));
    }, [setSelectedForms]);

    const handleDeselectAllClick = useCallback(() => {
        setSelectedForms(new Set());
    }, [setSelectedForms]);

    const getFormClickHandler = useCallback(
        (formIndex: number) => () => {
            const newSelectedForms = new Set(selectedForms);
            if (newSelectedForms.has(formIndex)) {
                newSelectedForms.delete(formIndex);
            } else {
                newSelectedForms.add(formIndex);
            }
            setSelectedForms(newSelectedForms);
        },
        [selectedForms, setSelectedForms]
    );

    const renderFormToggle = (formIndex: number | null) => {
        if (formIndex === null) {
            return <div key="placeholder" />;
        }
        const formName = ALL_FORM_NAMES[formIndex];
        const [formNamePart1, formNamePart2] = formName.split(" – ");
        const isSelected = selectedForms.has(formIndex);
        return (
            <button
                key={formIndex}
                type="button"
                onClick={getFormClickHandler(formIndex)}
                className={`
                    px-2 py-1.5 rounded-lg border transition-all duration-200 font-medium cursor-pointer text-center flex items-center justify-center min-h-[44px] whitespace-nowrap
                    ${isSelected
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-text-main border-border hover:border-primary/50"
                    }
                `}
            >
                {formNamePart1}<br />
                {formNamePart2}
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
                    Master Czech noun forms through focused practice.
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
                        {databaseNumberOfForms === undefined ? "--" : databaseNumberOfForms.toLocaleString()}
                    </div>
                    <div className="text-xs uppercase tracking-wider text-text-subtle font-semibold mt-1">
                        Forms
                    </div>
                </div>
            </section>

            <section className="mb-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="m-0! text-xl">Forms to practise</h3>
                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            onClick={handleSelectAllClick}
                            className="py-1 px-3 text-xs"
                            disabled={selectedForms.size === SELECTABLE_FORM_INDICES.length}
                        >
                            Select all
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleDeselectAllClick}
                            className="py-1 px-3 text-xs"
                            disabled={selectedForms.size === 0}
                        >
                            Clear
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-8">
                    {renderFormToggle(null) /* placeholder instead of nominative singular */}
                    {SELECTABLE_FORM_INDICES.map(renderFormToggle)}
                </div>

                <div className="flex justify-center">
                    <Button
                        variant="primary"
                        onClick={onStart}
                        disabled={selectedForms.size === 0}
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
