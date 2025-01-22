import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig} from 'axios';
import { Result } from '../../../Shared/Result/Result';
import {TokenManager} from "../../Token/TokenManager.ts";

abstract class BaseAPI {
    protected api: AxiosInstance;

    protected constructor(baseURL: string, requiresAuth: boolean = true) {
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
}

export abstract class AuthenticationBaseAPI<Request, Response = void>  {
    protected api: AxiosInstance;

   public constructor() {
        this.api = axios.create({
            baseURL: 'http://10.0.0.100:30069/api/',
            headers: {
                'Content-Type': 'application/json',
            },

        });
    }
    protected abstract handle(request: Request): Promise<Result<Response>>;
}

export abstract class UserManagementBaseAPI<Request, Response = void> {
    protected api: AxiosInstance;

    public constructor() {
        this.api = axios.create({
            baseURL: 'http://10.0.0.100:30420/api/UserProfile',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    protected abstract handle(request: Request): Promise<Result<Response>>;
}