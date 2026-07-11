import { Repository } from "typeorm/repository/Repository.js";
import { getDbContext} from "../Context/DatabaseContext.js";
import { CryptographyService } from "../Encryption/CryptographyService.js";
import { RefreshToken } from "../../Domain/Entities/RefreshToken.js";

export class RefreshTokenRepository {
    private repository: Repository<RefreshToken>;
    private readonly cryptoService = CryptographyService.getInstance();

    public constructor() {
        this.repository = getDbContext().getRepository(RefreshToken);
    }

    public async create(refreshToken: RefreshToken): Promise<RefreshToken> {
        refreshToken.token = await this.cryptoService.encrypt(refreshToken.token);
        return await this.repository.save(refreshToken);
    }

    public async get(): Promise<RefreshToken | null> {
        const refreshToken = await this.repository.find({ take: 1 });
        if (refreshToken.length === 0) {
            return null;
        }

        refreshToken[0].token = await this.cryptoService.decrypt(refreshToken[0].token);

        return refreshToken[0];
    }

    public async delete(): Promise<void> {
        await this.repository.clear();
    }
}
