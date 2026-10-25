export const LEDGER_TOKEN_ORIGIN = 'ledger';

export interface TokenIssuance {
    readonly origin: string;
    readonly tokenRequests: string[];
}

export interface IBlindTokenService {
    createTokenRequests(origin: string, count: number): Promise<TokenIssuance>;
    finalize(issuance: TokenIssuance, tokenResponses: string[]): Promise<Buffer[]>;
}
