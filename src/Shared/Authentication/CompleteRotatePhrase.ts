export class CompleteRotatePhraseCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'CompleteRotatePhraseCommand';
    constructor(public readonly confirmations: string[]) { }
}
