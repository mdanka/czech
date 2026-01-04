import React, { useState, useEffect, useRef, useCallback } from "react";
import { LocalData, IScores } from "./LocalData";
import { IWordDatabase } from "./types";
import { SUM_REDUCER } from "./utils";
import { WelcomeScreen } from "./WelcomeScreen";
import { PracticeScreen } from "./PracticeScreen";

export const AppContainer: React.FC = () => {
    const [view, setView] = useState<"welcome" | "practice">("welcome");
    const [selectedCases, setSelectedCasesState] = useState<Set<number>>(new Set(LocalData.DEFAULT_LOCAL_DATA.settings.selectedCases));
    const [scores, setScoresState] = useState<IScores>(LocalData.DEFAULT_LOCAL_DATA.scores);
    const [database, setDatabase] = useState<IWordDatabase | undefined>(undefined);
    const [databaseNumberOfWords, setDatabaseNumberOfWords] = useState<number | undefined>(undefined);
    const [databaseNumberOfDeclensions, setDatabaseNumberOfDeclensions] = useState<number | undefined>(undefined);

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

    const increaseScore = useCallback(async (type: keyof IScores) => {
        const newScores = { ...scores };
        newScores[type]++;
        await setScores(newScores);
    }, [scores, setScores]);

    const resetScores = useCallback(async () => {
        await setScores({ correct: 0, wrong: 0, skipped: 0 });
    }, [setScores]);


    const handleStart = useCallback(() => {
        setView("practice");
        window.scrollTo(0, 0); // Reset scroll position
    }, []);

    const handleBack = useCallback(() => {
        setView("welcome");
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="app">
            {view === "welcome" && (
                <WelcomeScreen
                    selectedCases={selectedCases}
                    setSelectedCases={setSelectedCases}
                    onStart={handleStart}
                    databaseNumberOfWords={databaseNumberOfWords}
                    databaseNumberOfDeclensions={databaseNumberOfDeclensions}
                />
            )}
            {view === "practice" && database && (
                <PracticeScreen
                    database={database}
                    selectedCases={selectedCases}
                    onBack={handleBack}
                    scores={scores}
                    increaseScore={increaseScore}
                    resetScores={resetScores}
                />
            )}
        </div>
    );
};
