export interface LinkCodeContract {
    code: string;
    expiresAt: string;
}

export class CreateLinkCodeCommand implements MediatorRequest<LinkCodeContract> {
    declare readonly _response?: LinkCodeContract;
    public readonly type = 'CreateLinkCodeCommand';
}
