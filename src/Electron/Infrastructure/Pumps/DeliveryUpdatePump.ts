import { Pump } from "./Pump.js";

export class DeliveryUpdatePump extends Pump{
    protected process(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
