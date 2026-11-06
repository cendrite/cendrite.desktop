export class CancelSignupCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'CancelSignupCommand';
}
