import {MessageViewModel} from "../../Models/MessageViewModel.ts";

export const MessageService = {

    async sendReadReceipt(msg: MessageViewModel[]): Promise<void> {
        return new Promise((resolve, _) => {
            // Simulate sending read receipt
            setTimeout(() => {
                console.log("Read receipt sent for messages:", msg);
                resolve();
            }, 1000);
        });
    }
}