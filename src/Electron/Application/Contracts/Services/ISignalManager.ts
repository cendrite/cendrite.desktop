export interface ISignalManager {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}
