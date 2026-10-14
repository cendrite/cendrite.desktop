export function unknownAction(reducer: string, action: { type: number }): never {
    throw new Error(`Unknown action type in ${reducer}: ${action.type}`);
}
