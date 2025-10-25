import {
    PreKeyRecord,
    PrivateKey,
    PublicKey,
    SignedPreKeyRecord,
} from '@signalapp/libsignal-client';

type StashedSecrets = {
    createdAt: number;
    registrationId: number;
    identityPriv: PrivateKey;
    identityPub: PublicKey;
    signedPreKey: SignedPreKeyRecord;
    ecPreKeys: PreKeyRecord[];
};

export class KeyCacher {
    public static instance: KeyCacher;

    public static getInstance(): KeyCacher {
        if (!KeyCacher.instance) {
            KeyCacher.instance = new KeyCacher();
        }

        this.instance.clearOldEntries(10 * 60 * 1000);
        return KeyCacher.instance;
    }

    private constructor() { }
    private cache: Map<string, StashedSecrets> = new Map();
        
    public stashSecrets(cacheKey: string, secrets: Omit<StashedSecrets, 'createdAt'>): void {
        this.cache.set(cacheKey, { ...secrets, createdAt: Date.now() });
    }

    public retrieveSecrets(cacheKey: string): StashedSecrets | undefined {
        const secrets = this.cache.get(cacheKey);
        if (secrets) {
            this.cache.delete(cacheKey);
        }
        return secrets;
    }

    public clearOldEntries(maxAgeMs: number): void {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.createdAt > maxAgeMs) {
                this.cache.delete(key);
            }
        }
    }
}
