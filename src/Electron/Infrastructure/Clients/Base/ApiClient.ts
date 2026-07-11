import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Envelope } from './Envelope.js';
import { Result } from '../../../../Shared/Result/Result.js';
import { ErrorMessage } from '../../../../Shared/Result/ErrorMessage.js';
import { TokenManager } from '../../Services/TokenManager.js';

export class ApiClient {
    protected api: AxiosInstance;
    private readonly tokenManager: TokenManager | null

    /**
     * Creates an instance of ApiClient.
     * @param baseURL The base url of the api.
     * @param requiresAuth A boolean indicating if the api requires authentication.
     * @returns An instance of ApiClient.
     * @example
     * ```typescript
     * const client = new ApiClient("https://api.example.com", true);
     * ```
     * Using the tokenManager parameter, will add an interceptor to the api instance to add the jwt token to the request headers. If no tokenManager is provided, the api client will not add any authentication headers.
    * */
    public constructor(baseURL: string, tokenManager: TokenManager | null) {
        this.api = axios.create({
            baseURL,
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
                    console.warn('Token expired, refreshing token');
                    try {
                        this.tokenManager!.refreshTokens();
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
