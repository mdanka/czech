import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMars, faVenus, faCircle, faUser } from "@fortawesome/free-solid-svg-icons";
import { IGender } from "./types";

interface IGenderIconProps {
    gender: IGender | null;
    isAnimated: boolean;
    className?: string;
}

export const GenderIcon: React.FC<IGenderIconProps> = ({ gender, isAnimated, className }) => {
    let icon;
    let colorClass;
    switch (gender) {
        case null:
            return null;
        case "f":
            icon = faVenus;
            colorClass = "text-feminine";
            break;
        case "m":
            icon = isAnimated ? faUser : faMars;
            colorClass = "text-masculine";
            break;
        case "n":
            icon = faCircle;
            colorClass = "text-neutrum";
            break;
        default:
            console.error("Unexpected gender: " + gender);
            return null;
    }

    return (
        <FontAwesomeIcon
            icon={icon}
            className={`${colorClass} ${className || ""}`}
            aria-hidden="true"
        />
    );
};
