export class ErrorMessage {
    public readonly code: string;
    public readonly message: string;

    constructor(code: string, message: string) {
        this.code = code;
        this.message = message;
    }
}
