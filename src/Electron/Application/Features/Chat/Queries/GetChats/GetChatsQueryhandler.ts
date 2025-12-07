import { Result } from "../../../../../../Shared/Result/Result.js";
import { Handler } from "../../../../Mediator/Handler.js";
import { GetChatsDto } from "./GetChatsDto.js";
import { GetChatsQuery } from "./GetChatsQuery.js";

export class GetChatsQueryHandler implements Handler<GetChatsQuery, GetChatsDto> {
    handle(request: GetChatsQuery): Promise<Result<GetChatsDto>> {
        throw new Error("Method not implemented.");
    }
}
