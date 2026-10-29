import { MediaContract } from '../Models/MediaContract.js';

// Downloads the GIF in its sendable rendition, ready to go through the encrypted media pipeline.
export class GetGifQuery implements MediatorRequest<MediaContract> {
    declare readonly _response?: MediaContract;
    public readonly type = 'GetGifQuery';
    constructor(public readonly id: string) {}
}
