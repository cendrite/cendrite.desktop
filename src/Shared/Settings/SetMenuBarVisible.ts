export class SetMenuBarVisibleCommand implements MediatorRequest<void> {
    declare readonly _response?: void;
    public readonly type = 'SetMenuBarVisibleCommand';
    constructor(public readonly visible: boolean) {}
}
