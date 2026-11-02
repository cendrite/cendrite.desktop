export class GetGifPreviewQuery implements MediatorRequest<Uint8Array> {
    declare readonly _response?: Uint8Array;
    public readonly type = 'GetGifPreviewQuery';
    constructor(public readonly url: string) {}
}
