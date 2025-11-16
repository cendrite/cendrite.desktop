import { Result } from "../../../../../Shared/Result/Result.ts";
import {ApiClient} from "../../ApiClient.ts";
import { API_URLS } from "../../ApiUrls.ts";

export class LogoutApi {
    private readonly client: ApiClient;

    constructor() {
        this.client = new ApiClient(API_URLS.IDENTITY.AUTH.LOGOUT, true);
    }

    async logout() : Promise<Result> {
        return await this.client.handle({
            method: "POST",
        })
    }
}
