
export abstract class DomainEvent {
    public readonly occurredOn: Date; 
    static readonly type: string;

    constructor(occurredOn: Date) {
        this.occurredOn = occurredOn; 
    }
}

type DomainEventCtor = new (...args: any[]) => DomainEvent;
type Deserializer = (raw: any, occurredOn: Date) => DomainEvent;

const registry = new Map<string, DomainEventCtor>();
const deserializerRegistry = new Map<string, Deserializer>();

export function registerDomainEvent(type: string, ctor: DomainEventCtor, deserialize: Deserializer): void {
    registry.set(type, ctor);
    deserializerRegistry.set(type, deserialize);

}

export function resolveDeserializer(type: string): Deserializer | undefined {
    return deserializerRegistry.get(type);
}
