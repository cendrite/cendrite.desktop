import { IChatStore } from "../../Application/Contracts/Repositories/IChatStore.js";
import { Mediator } from "../../Application/Mediator/Mediator.js";
import { IOutboxRepository } from "../Interfaces/IOutboxRepository.js";
import { SignalManager } from "../Signal/SignalManager.js";
import { Pump } from "./Pump.js";

export class DeliveryUpdatePump extends Pump {
    constructor(
        private readonly chatStore: IChatStore,
        private readonly eventRepository: IOutboxRepository,
        private readonly mediator: Mediator,
        private readonly mainWindow: Electron.BrowserWindow,
        private readonly signalManager: SignalManager) { super(); }

    protected async process(): Promise<void> {
        while(this.isRunning) {
            if(!this.signalManager.isConnected('Messaging')) {
                console.log('DeliveryUpdatePump: Messaging hub is not connected, waiting...');
                await this.sleep(5_000);
                continue;
            }
        }
    }
}
