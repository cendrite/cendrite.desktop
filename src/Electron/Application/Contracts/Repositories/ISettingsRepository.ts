export interface ISettingsRepository {
    get(): Promise<string | null>;
    set(value: string): Promise<void>;
    delete(): Promise<void>;
}
