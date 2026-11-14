export class RemoveAvatarCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'RemoveAvatarCommand';
}
