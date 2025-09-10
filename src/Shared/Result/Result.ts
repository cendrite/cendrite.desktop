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

    public static success(): Result;
    public static success<T>(data: T): Result<T>;

    public static success<T>(data?: T): Result<T | void> {
        return new Result<T | void>(true, data ?? null);
    }

    public static fail(errorMessage: ErrorMessage): Result;
    public static fail<T>(errorMessage: ErrorMessage): Result<T>;
    public static fail(): Result;

    public static fail<T>(errorMessage?: ErrorMessage): Result<T | void> {
        return new Result<T | void>(false, null, errorMessage);
    }
}
