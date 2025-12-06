export class DeletePreKeyCommand {
    public type = DeletePreKeyCommand.name;
    constructor(public readonly preKeyId: number) {}
}
