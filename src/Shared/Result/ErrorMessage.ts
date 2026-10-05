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

    public static fromProblemDetails(problemDetails: {
        title?: string;
        detail?: string;
        status?: number;
        instance?: string;
        type?: string;
        errors?: {code: string; description: string; type: number}[];
    } | null | undefined): ErrorMessage {
        // Not every failure answers with problem details: a 404 from the gateway has no body at all.
        const details = typeof problemDetails === 'object' && problemDetails !== null ? problemDetails : {};
        const description = details.errors?.[0]?.description ?? details.detail ?? details.title ?? 'An error occurred.';

        return new ErrorMessage(details.title ?? null, ErrorMessage.TrimErrorMessageHelper(description));
    }

    // Removes backend error code defined in parentheses and double quotes from the error message
    private static TrimErrorMessageHelper(errorMessage: string): string {
        return errorMessage.replace(/ *\([^)]*\)/g, '').replace(/"/g, '');
    }
}
