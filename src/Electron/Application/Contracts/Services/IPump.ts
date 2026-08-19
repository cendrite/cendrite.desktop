export interface IPump {
    notify(): void;
    start(): void;
    stop(): void;
}
