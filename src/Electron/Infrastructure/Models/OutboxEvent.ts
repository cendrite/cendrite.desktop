export class OutboxEvent {
    public readonly id: string;
    public readonly type: string;
    public readonly content: string;
    public readonly occurredOn: Date;
    public processedOn: Date | null;
    public readonly error: string | null;

    constructor(
        id: string,
        type: string,
        content: string,
        occuredOn: Date,
        processedOn: Date | null = null,
        error: string | null = null,
    ) {
        this.id = id;
        this.type = type;
        this.content = content;
        this.occurredOn = occuredOn;
        this.processedOn = processedOn;
        this.error = error;
    }
}
