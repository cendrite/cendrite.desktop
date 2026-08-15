export class PumpEvent {
    id: number;
    type: string;
    content: string;
    occuredOn: Date;
    processedOn: Date | null;
    error: string | null;

    constructor(
        id: number,
        type: string,
        content: string,
        occuredOn: Date,
        processedOn: Date | null = null,
        error: string | null = null,
    ) {
        this.id = id;
        this.type = type;
        this.content = content;
        this.occuredOn = occuredOn;
        this.processedOn = processedOn;
        this.error = error;
    }
}
