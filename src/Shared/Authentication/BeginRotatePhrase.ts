export interface BeginRotatePhraseResponse {
    words: string[];
    confirmIndices: number[];
}

export class BeginRotatePhraseCommand implements MediatorRequest<BeginRotatePhraseResponse> {
    declare readonly _response?: BeginRotatePhraseResponse;
    public readonly type = 'BeginRotatePhraseCommand';
}
