export class ErrorMessage {
    public readonly code: string | null;
    public readonly message: string;
    public readonly errorCode: string | null;

    public constructor(code: string | null, message: string, errorCode: string | null = null) {
        this.code = code;
        this.message = message;
        this.errorCode = errorCode;
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

    public static fromProblemDetails(problemDetails: {
        title: string;
        detail: string;
        status: number;
        instance: string;
        type: string;
        errors: {code: string; description: string; type: number}[];
    }): ErrorMessage {
        const description = problemDetails.errors?.[0]?.description ?? problemDetails.detail ?? problemDetails.title ?? 'An error occurred.';
        return new ErrorMessage(
            problemDetails.title ?? null,
            ErrorMessage.TrimErrorMessageHelper(description),
            problemDetails.errors?.[0]?.code ?? null,
        );
    }

    // Removes backend error code defined in parentheses and double quotes from the error message
    private static TrimErrorMessageHelper(errorMessage: string): string {
        return errorMessage.replace(/ *\([^)]*\)/g, '').replace(/"/g, '');
    }
}
