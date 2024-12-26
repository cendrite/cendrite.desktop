/**
 * Moves the focus to the next input field if a value is entered.
 * 
 * @param currentIndex - The current index of the input field.
 * @param totalFields - The total number of input fields.
 * @param e - The change event triggered by user input.
 */
export const focusNextInput = (
    currentIndex: number,
    totalFields: number,
    e: React.ChangeEvent<HTMLInputElement>
) => {
    const value = e.target.value;

    if (value && currentIndex < totalFields - 1) {
        const nextInput = document.getElementById(`code-${currentIndex + 1}`);
        nextInput?.focus();
    }
};

/**
 * Backtracks the focus to the previous input field if the current field is empty and the Backspace key is pressed.
 * @param index - The index of the current input field. 
 * @param e - The keydown event triggered by the user.
 */
export const backTrackInput = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && index > 0 && e.currentTarget.value === "") {
        const prevInput = document.getElementById(`code-${index - 1}`);
        prevInput?.focus();
    }
};

export const inhibitNonNumericInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
    }
};