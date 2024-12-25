export class Envelope<T = void> {
    public readonly result!: T | null;
    public readonly errorMessage!: string | null;
    public readonly timeGenerated!: Date;
}
