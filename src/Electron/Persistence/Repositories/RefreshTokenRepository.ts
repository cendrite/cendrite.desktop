import { Repository } from "typeorm/repository/Repository.js";
import { RefreshToken } from "../Entities/RefreshToken.js";
import { DatabaseContext } from "../Context/DatabaseContext.js";
import { CryptographyService } from "../Encryption/CryptographyService.js";

export class RefreshTokenRepository {
    private repository: Repository<RefreshToken>;
    private readonly cryptoService = CryptographyService.getInstance();

    public constructor() {
        this.repository = DatabaseContext.getRepository(RefreshToken);
    }

    public async create(refreshToken: RefreshToken): Promise<RefreshToken> {
        refreshToken.token = await this.cryptoService.encrypt(refreshToken.token);
        return await this.repository.save(refreshToken);
    }

    public async get(): Promise<RefreshToken> {
        const refreshToken = await this.repository.find({ take: 1 });
        if (refreshToken.length === 0) {
            throw new Error("No refresh token found");
        }

        refreshToken[0].token = await this.cryptoService.decrypt(refreshToken[0].token);

        return refreshToken[0];
    }

    public async deleteAll(): Promise<void> {
        await this.repository.delete({});
    }
}