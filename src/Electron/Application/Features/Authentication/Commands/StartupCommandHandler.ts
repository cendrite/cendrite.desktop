import { Result } from '../../../../../Shared/Result/Result.js';
import { TokenManager } from '../../../../Infrastructure/Services/TokenManager.js';
import { SignalManager } from '../../../../Infrastructure/Signal/SignalManager.js';
import { UserContract } from '../../../Contracts/Models/UserContract.js';
import { IDeviceRepository } from '../../../Contracts/Repositories/IDeviceRepository.js';
import { IUserRepository } from '../../../Contracts/Repositories/IUserRepository.js';
import { IPump } from '../../../Contracts/Services/IPump.js';
import { Handler } from '../../../Mediator/Handler.js';
import { StartupCommand, StartupDto } from '../Contracts/Startup.js';

export class StartupCommandHandler implements Handler<StartupCommand, StartupDto> {
    constructor(
        private readonly deviceRepository: IDeviceRepository,
        private readonly userRepository: IUserRepository,
        private readonly tokenManager: TokenManager,
        private readonly signalManager: SignalManager,
        private readonly messagePump: IPump,
        private readonly deliveryStatusUpdatePump: IPump,
    ) { }

    public async handle(_cmd: StartupCommand): Promise<Result<StartupDto>> {
        const device = await this.deviceRepository.get();
        if (!device) {
            return Result.success({
                user: null,
            });
        }

        const user = await this.userRepository.get(true);
        if (!user) {
            throw new Error('THIS IS A CRITICAL STATE. DEVICE EXISTS BUT USER DOES NOT. THIS SHOULD NEVER HAPPEN.');
        }

        const returnUsr = new UserContract(
            user.id,
            user.username,
            user.userTag,
            device.id,
            device.connectionId,
            user.connectionIds.map((c) => c.connectionId),
            user.avatarKey,
            user.displayName,
        );

        await this.tokenManager.init(returnUsr.id, returnUsr.deviceId);
        await this.signalManager.connect();
        this.messagePump.start();
        this.deliveryStatusUpdatePump.start();

        return Result.success({
            user: returnUsr,
        });
    }
}
