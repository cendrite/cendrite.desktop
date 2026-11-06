export interface BeginSignupResponse {
    words: string[];
    confirmIndices: number[];
}

export class BeginSignupCommand implements MediatorRequest<BeginSignupResponse> {
    declare readonly _response?: BeginSignupResponse;
    public readonly type = 'BeginSignupCommand';
}
