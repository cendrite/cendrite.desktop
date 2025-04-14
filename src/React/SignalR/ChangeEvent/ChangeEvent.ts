import {ChangeEventType} from "./ChangeEventType.ts";

export interface ChangeEvent<T = unknown>
{
    id: string;
    type: ChangeEventType;
    title: string;
    description: string;
    occurredOn: string;
    data: T;
}