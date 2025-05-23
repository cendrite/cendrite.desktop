import { Repository } from "typeorm";
import {Chat} from "../../Domain/Aggregates/Chat.js";
import {getDbContext} from "../Context/DatabaseContext.js";

export class ChatRepository {
    private repository: Repository<Chat>;

    public constructor() {
        this.repository = getDbContext().getRepository(Chat);
    }

    public async create(chat: Chat): Promise<Chat> {
        return await this.repository.save(chat);
    }
}