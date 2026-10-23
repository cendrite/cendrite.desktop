import { IKeyStoreProvider } from '#electron/Application/Contracts/Providers/IKeyStoreProvider';
import { Pump } from './Pump.js';

export class PreKeyPump extends Pump {
    constructor(private readonly kestoreProvider: IKeyStoreProvider) {
        super();
    }

    protected process(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
