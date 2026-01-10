import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "primary" | "danger" | "success";
    size?: "default" | "tiny";
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
    variant = "default",
    size = "default",
    fullWidth = false,
    className = "",
    children,
    ...props
}, ref) => {
    const baseStyles = "inline-flex items-center justify-center border font-sans no-underline cursor-pointer transition-all duration-200 select-none shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,1)] disabled:opacity-50 disabled:cursor-not-allowed";

    const sizeStyles = {
        default: "px-4 py-2 text-[14px]",
        tiny: "px-1.5 py-0.5 text-[11px] leading-tight"
    };

    // Gradient styles ported from buttonColours mixin
    const variantStyles = {
        default: "border-border bg-white text-text-main hover:bg-[#f6f6f6] active:bg-[#e8e8e8] bg-gradient-to-b from-white to-[#f6f6f6]",
        primary: "border-border text-primary font-semibold hover:bg-[#f6f6f6] active:bg-[#e8e8e8] bg-gradient-to-b from-white to-[#f6f6f6]",
        danger: "border-danger text-danger hover:bg-[#fef2f2] active:bg-[#fee2e2] bg-gradient-to-b from-white to-[#fef2f2]",
        success: "border-success text-success hover:bg-[#f0fdf4] active:bg-[#dcfce7] bg-gradient-to-b from-white to-[#f0fdf4]"
    };

    const widthStyles = fullWidth ? "w-full" : "w-auto";

    return (
        <button
            ref={ref}
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyles} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = "Button";
