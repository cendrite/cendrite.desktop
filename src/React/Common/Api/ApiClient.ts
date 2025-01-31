import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig} from "axios";
import {TokenManager} from "../../Token/TokenManager.ts";
import {Result} from "../../../Shared/Result/Result.ts";
import {Envelope} from "./Envelope.ts";
import {ErrorMessage} from "../../../Shared/Result/ErrorMessage.ts";

export class ApiClient{
    protected api: AxiosInstance;

    /**
     * Creates an instance of ApiClient.
     * @param baseURL The base url of the api.
     * @param requiresAuth A boolean indicating if the api requires authentication.
     * @returns An instance of ApiClient.
     * @example
     * ```typescript
     * const client = new ApiClient("https://api.example.com", true);
     * ```
     * Using the boolean requiresAuth parameter, will add an interceptor to the api instance to add the jwt token to the request headers.
     * If the token is expired, the interceptor will attempt to refresh the token through the {@link TokenManager}.
    * */
    public constructor(baseURL: string, requiresAuth: boolean = true) {
        this.api = axios.create({
            baseURL,
            headers: {
                "Content-Type": "application/json",
            }
        });

        if(requiresAuth){
            this.addAuthInterceptors();
        }
    }

    private addAuthInterceptors(){
        const tokenManager = TokenManager.getInstance();

        // Request interceptor -> add token to any request made by the api
        this.api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
            const token = tokenManager.getJwt();
            console.log("Token:", token);
            if(token){
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Response interceptor -> handle token expiration
        this.api.interceptors.response.use((response)=> response,
            async (error: AxiosError) => {
                if(error.response?.status === 401) {
                    console.warn("Token expired, refreshing token");
                    try{
                        await tokenManager.refreshTokens();
                        const newToken = tokenManager.getJwt();
                        if(newToken && error.config) {
                            error.config.headers.Authorization = `Bearer ${newToken}`;
                            return this.api.request(error.config);
                        }
                    } catch(refreshError){
                        console.error("Token refresh failed. Fatal. Logging out.");
                        //TODO: Handle fatal errors that should result in logout.
                    }
                }
                return Promise.reject(error);
            });
    }

    public async handle<T>(config: AxiosRequestConfig): Promise<Result<T>> {
        try{
            const response: AxiosResponse<Envelope<T>> = await this.api.request<Envelope<T>>(config);
            return Result.success(response.data.result!);
        } catch(error){
            if(error instanceof AxiosError && error.response){
                return Result.fail<T>(ErrorMessage.fromApiResponse("ApiError", error.response.data?.errorMessage || "An error occurred."));
            }
            console.error("Unexpected error during api call:", error);
            return Result.fail<T>(new ErrorMessage("ApiError", "An unexpected error occurred."));
        }
    }
}
