export class ErrorMessage {
    public readonly code: string | null;
    public readonly message: string;

    public constructor(code: string | null, message: string) {
        this.code = code;
        this.message = message;
    }

    public static fromApiResponse(code: string, message: string): ErrorMessage {
        return new ErrorMessage(code, ErrorMessage.TrimErrorMessageHelper(message));
    }

    private static TrimErrorMessageHelper(errorMessage: string): string {
        return errorMessage.replace(/ *\([^)]*\)/g, '').replace(/"/g, '');
    }
}
