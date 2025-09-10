export class ErrorMessage {
    public readonly code: string | null;
    public readonly message: string;

    public constructor(code: string | null, message: string) {
        this.code = code;
        this.message = message;
    }

    /**
     * Creates an ErrorMessage object from an API response.
     * Trims the backend error code defined in parentheses and double quotes.
     * @param code The error code.
     * @param message The error message.
     * @returns An ErrorMessage object.
     * @example
     * ```typescript
     * const errorMessage = ErrorMessage.fromApiResponse("GetNonceFailed", <api error>);
     * ```
     */
    public static fromApiResponse(code: string, message: string): ErrorMessage {
        return new ErrorMessage(code, ErrorMessage.TrimErrorMessageHelper(message));
    }
    
    public static fromProblemDetails(problemDetails: { title: string; detail: string; status: number; instance: string; type: string; }): ErrorMessage {
        return new ErrorMessage(problemDetails.title, ErrorMessage.TrimErrorMessageHelper(problemDetails.detail));
    }

    // Removes backend error code defined in parentheses and double quotes from the error message
    private static TrimErrorMessageHelper(errorMessage: string): string {
        return errorMessage.replace(/ *\([^)]*\)/g, '').replace(/"/g, '');
    }
}
