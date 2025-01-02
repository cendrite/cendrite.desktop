import { ErrorMessage } from "./ErrorMessage.js";

export class Result<T = void> {
    public readonly success: boolean;
    public readonly errorMessage: ErrorMessage | null;
    public readonly data: T | null;

    constructor(success: boolean, data: T | null = null, errorMessage: ErrorMessage | null = null) {
        this.success = success;
        this.data = data;
        this.errorMessage = errorMessage;
    }

    // Overloaded signatures for success
    public static success(): Result<void>;
    public static success<T>(data: T): Result<T>;

    // Implementation for success
    public static success<T>(data?: T): Result<T | void> {
        return new Result<T | void>(true, data ?? null);
    }

    // Overloaded signatures for fail
    public static fail(errorMessage: ErrorMessage): Result<void>;
    public static fail<T>(errorMessage: ErrorMessage): Result<T>;

    // Implementation for fail
    public static fail<T>(errorMessage: ErrorMessage): Result<T | void> {
        return new Result<T | void>(false, null, errorMessage);
    }

}
