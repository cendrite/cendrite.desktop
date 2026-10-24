import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Envelope } from './Envelope.js';
import { Result } from '#shared/Result/Result';
import { ErrorMessage } from '#shared/Result/ErrorMessage';
import { TokenManager } from '#electron/Infrastructure/Services/TokenManager';
import { Agent } from 'node:https';

export class ApiClient {
    protected api: AxiosInstance;
    private readonly tokenManager: TokenManager | null

    /**
     * Creates an instance of ApiClient.
     * @param baseURL The base url of the api.
     * @param tokenManager Adds the jwt to every request and refreshes it on a 401. Pass null for an unauthenticated client.
     * @param httpsAgent Optional connection pool for this client. Without one, requests use Node's global agent and can reuse connections opened by other clients.
     * @returns An instance of ApiClient.
     * @example
     * ```typescript
     * const client = new ApiClient("https://api.example.com", tokenManager);
     * const anonymous = new ApiClient("https://api.example.com", null, new Agent({ keepAlive: true }));
     * ```
    * */
    public constructor(baseURL: string, tokenManager: TokenManager | null, httpsAgent?: Agent) {
        this.api = axios.create({
            baseURL,
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.tokenManager = tokenManager;

        if (tokenManager) {
            this.addAuthInterceptors();
        }
    }

    private addAuthInterceptors() {
        this.api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
            const token = this.tokenManager!.getJwt();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        this.api.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response?.status === 401) {
                    console.warn(
                        'Token expired, refreshing token:',
                        error.config?.method,
                        (error.config?.baseURL ?? '') + (error.config?.url ?? ''),
                    );
                    try {
                        await this.tokenManager!.refreshTokens();
                        const newToken = this.tokenManager!.getJwt();
                        if (newToken && error.config) {
                            error.config.headers.Authorization = `Bearer ${newToken}`;
                            return this.api.request(error.config);
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed. Fatal. Logging out.');
                        //TODO: Handle fatal errors that should result in logout.
                    }
                }
                return Promise.reject(error);
            },
        );
    }

    public async handle<T>(config: AxiosRequestConfig): Promise<Result<T>>;
    public async handle<T>(config: AxiosRequestConfig, allowEmpty: true): Promise<Result<T | void>>;

    public async handle<T>(config: AxiosRequestConfig, allowEmpty?: boolean): Promise<Result<T | void>> {
        try {
            const response: AxiosResponse<Envelope<T | null>> = await this.api.request<Envelope<T>>(config);

            if (response.status === 204 && allowEmpty) {
                return Result.success();
            }

            return Result.success(response.data.result!);
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                console.error(
                    'Api call failed:',
                    error.config?.method,
                    (error.config?.baseURL ?? '') + (error.config?.url ?? ''),
                    error.response.status,
                    JSON.stringify(error.response.data),
                );
                return Result.fail<T>(
                    ErrorMessage.fromApiResponse('ApiError', error.response.data?.errorMessage || 'An error occurred.' + error.code),
                );
            }
            console.error('Unexpected error during api call:', error);
            return Result.fail<T>(new ErrorMessage('ApiError', 'An unexpected error occurred.'));
        }
    }

    public async handleConduit<T>(config: AxiosRequestConfig, allowEmpty: true): Promise<Result<T | void>>;
    public async handleConduit<T>(config: AxiosRequestConfig, allowEmpty?: boolean): Promise<Result<T>>;

    public async handleConduit<T>(config: AxiosRequestConfig): Promise<Result<T | void>> {
        try {
            const response: AxiosResponse<T | null> = await this.api.request<T>(config);
            if (response.status === 204) {
                return Result.success();
            }

            return Result.success(response.data!);
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                const data = error.response.data as ProblemDetails;
                console.error('Api call failed:', error.response.status, JSON.stringify(data));
                if (error.response.status === 401) {
                    return Result.fail<T>(new ErrorMessage('Unauthorized', 'Unauthorized'));
                }
                return Result.fail<T>(ErrorMessage.fromProblemDetails(data));
            }
            console.error('Unexpected error during api call:', error);
            return Result.fail<T>(new ErrorMessage('ApiError', 'An unexpected error occurred.'));
        }
    }
}

interface ProblemDetails {
    title: string;
    detail: string;
    status: number;
    instance: string;
    type: string;
    errors: { code: string; description: string; type: number }[];
}
