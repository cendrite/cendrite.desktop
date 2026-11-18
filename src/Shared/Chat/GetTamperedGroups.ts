export class GetTamperedGroupsQuery implements MediatorRequest<string[]> {
    declare readonly _response?: string[];
    public readonly type = 'GetTamperedGroupsQuery';
}
