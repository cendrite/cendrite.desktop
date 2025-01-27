import axios, {AxiosInstance} from 'axios';
import { Result } from '../../../Shared/Result/Result';



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
