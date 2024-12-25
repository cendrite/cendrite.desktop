import axios, { AxiosInstance } from 'axios';
import { Result } from '../../../Common/Result/Result';

export abstract class AuthenticationBaseAPI<Request, Response = void> {
    protected api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: 'http://10.0.0.100:30069/api/User',
            headers: {
                'Content-Type': 'application/json',
            },

        });
    }

    protected abstract handle(request: Request): Promise<Result<Response>>;

}