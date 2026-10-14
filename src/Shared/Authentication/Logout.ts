export class LogoutCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'LogoutCommand';
}
