import { IPump } from "#electron/Application/Contracts/Services/IPump";

export abstract class Pump implements IPump {
    protected isRunning: boolean = false;
    protected wake: (() => void) | null = null;
    protected wakePending: boolean = false;

    public start(): void {
        if (!this.isRunning) {
            this.isRunning = true;
            this.process();
        }
    }

    protected abstract process(): Promise<void>;

    public stop(): void {
        this.isRunning = false;
        this.notify();
    }

    public notify(): void {
        if (this.wake) {
            this.wake();
        } else {
            this.wakePending = true;
        }
    }


    protected sleep(ms: number): Promise<void> {
        return new Promise<void>((resolve) => {
            if (this.wakePending) {
                this.wakePending = false;
                resolve();
                return;
            }

            const done = () => {
                clearTimeout(timer);
                this.wake = null;
                resolve();
            };

            const timer = setTimeout(done, ms);
            this.wake = done;
        });
    }
}
