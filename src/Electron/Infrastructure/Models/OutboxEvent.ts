export class OutboxEvent {
    public readonly id!: number;
    public readonly type: string;
    public readonly content: string;
    public readonly occurredOn: Date;
    public readonly processedOn: Date | null;
    public readonly error: string | null;

    constructor(
        type: string,
        content: string,
        occuredOn: Date,
        processedOn: Date | null = null,
        error: string | null = null,
    ) {
        this.type = type;
        this.content = content;
        this.occurredOn = occuredOn;
        this.processedOn = processedOn;
        this.error = error;
    }
}
