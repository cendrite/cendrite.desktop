import { ErrorMessage } from "../../../../../../Shared/Result/ErrorMessage.js";
import { Result } from "../../../../../../Shared/Result/Result.js";
import { DeviceRepository } from "../../../../../Infrastructure/Persistence/Repositories/DeviceRepository.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { GetDeviceDto } from "./GetDeviceDto.js";
import { GetDeviceQuery } from "./GetDeviceQuery.js";

export class GetDeviceQueryHandler implements Handler<GetDeviceQuery, GetDeviceDto> {

    async handle(request: GetDeviceQuery): Promise<Result<GetDeviceDto>> {
        try {
            const repo = new DeviceRepository();
            const device = await repo.get();

            if (device == null) {
                return Result.fail<GetDeviceDto>(new ErrorMessage(null, "DeviceNotFound"));
            }

            const dto = GetDeviceDto.MapFrom(device);

            return Result.success(dto);

        }
        catch (error: unknown) {
            const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
            console.error('Get device error:', errorMessage);
            return Result.fail<GetDeviceDto>(new ErrorMessage(null, "GetDeviceFailed"));
        }
    }
}