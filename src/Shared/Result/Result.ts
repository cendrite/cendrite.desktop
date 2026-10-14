import { ErrorMessage } from "./ErrorMessage.js";

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
