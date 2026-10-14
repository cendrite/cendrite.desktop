import { ErrorMessage } from "./ErrorMessage.js";

/**
 * Outcome of an operation. Narrow on `success` to get `data` or `errorMessage`:
 * ```typescript
 * if (!result.success) return Result.fail(result.errorMessage);
 * use(result.data);
 * ```
 * The absent member is declared as `?: undefined` so it can still be read without narrowing
 * (e.g. `result.errorMessage?.message`), while a plain object keeps crossing the IPC boundary intact.
 */
export type Result<T = void> = Success<T> | Failure;

export interface Success<T> {
    readonly success: true;
    readonly data: T;
    readonly errorMessage?: undefined;
}

export interface Failure {
    readonly success: false;
    readonly errorMessage: ErrorMessage;
    readonly data?: undefined;
}

function success(): Result;
function success<T>(data: T): Result<T>;
function success<T>(data?: T): Result<T | void> {
    return { success: true, data };
}

function fail<T = void>(errorMessage: ErrorMessage): Result<T> {
    return { success: false, errorMessage };
}

export const Result = { success, fail };
