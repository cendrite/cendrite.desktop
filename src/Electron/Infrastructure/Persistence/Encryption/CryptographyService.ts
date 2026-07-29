import * as crypto from 'crypto';
import keytar from 'keytar';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const APP_NAME = 'Cypherly.Desktop';
const ACCOUNT_NAME = 'Cypherly.Desktop.EncryptionKey';

export class CryptoError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'CryptoError';
    }
}

export class CryptographyService {
    private static instance: CryptographyService;
    private cryptoKey: Buffer | null = null;
    private initialized = false;

    private constructor() { }

    /** 
     * Singleton instance of the CryptographyService
    */
    public static getInstance(): CryptographyService {
        if (!CryptographyService.instance) {
            CryptographyService.instance = new CryptographyService();
        }

        return CryptographyService.instance;
    }

    /**
     * Initializes the encryption key
     * If the key is not stored, a new key is generated and stored
     * If the key is stored, it is retrieved
     * @returns Promise<void>
     * @throws CryptoError
     */
    async initializeEncryptionKey(): Promise<void> {
        if (this.initialized) return;

        try {
            let storedKey = await keytar.getPassword(APP_NAME, ACCOUNT_NAME);
            if (storedKey === null) {
                const newKey = crypto.randomBytes(KEY_LENGTH);
                storedKey = newKey.toString('hex');
                await keytar.setPassword(APP_NAME, ACCOUNT_NAME, storedKey);
            }

            this.cryptoKey = Buffer.from(storedKey, 'hex');
            this.initialized = true;
        } catch (err) {
            const error = err as Error;
            throw new CryptoError(
                `Failed to initialize encryption key: ${error.message}`,
                'INIT_FAILED'
            );
        }
    }

    /**
     * Encrypts the data using the encryption key
     * @param data The data to be encrypted
     * @returns Promise with EncryptedData
     * @throws CryptoError
     */
    async encrypt(data: string): Promise<string> {
        if (!data) throw new CryptoError("Data cannot be null or empty", "INVALID_DATA");

        try {
            if (this.initialized === false)
                await this.initializeEncryptionKey();
            const iv = crypto.randomBytes(12);

            const cipher = crypto.createCipheriv(ALGORITHM, this.cryptoKey! as crypto.CipherKey, iv);
            let encryptedData = cipher.update(data, 'utf8', 'hex');
            encryptedData += cipher.final('hex');

            const authTag = cipher.getAuthTag().toString('hex');

            return `${encryptedData}|${iv.toString('hex')}|${authTag}`;
        }
        catch (err) {
            const error = err as Error;
            throw new CryptoError(
                `Encryption failed: ${error.message}`,
                'ENCRYPTION_FAILED'
            );
        }
    }


    /**
     * Decrypts the encrypted data using the encryption key
     * @param encryptedData The encrypted data
     * @param iv The initialization vector
     * @param authTag The authentication tag
     * @returns Promise<string>
     * @throws CryptoError
     */
    async decrypt(encryptedString: string): Promise<string> {
        if (!encryptedString) {
            throw new CryptoError('Missing required decryption parameters', 'INVALID_PARAMS');
        }

        try {
            if (!this.initialized) {
                await this.initializeEncryptionKey();
            }

            const [encryptedData, iv, authTag] = encryptedString.split('|');

            const decipher = crypto.createDecipheriv(
                ALGORITHM,
                this.cryptoKey! as crypto.CipherKey,
                Buffer.from(iv, 'hex')
            ) as crypto.DecipherGCM;

            decipher.setAuthTag(Buffer.from(authTag, 'hex'));

            let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
            decryptedData += decipher.final('utf8');

            return decryptedData;
        } catch (err) {
            const error = err as Error;
            if (error.message.includes('auth')) {
                throw new CryptoError(
                    'Data integrity check failed',
                    'INTEGRITY_CHECK_FAILED'
                );
            }
            throw new CryptoError(
                `Decryption failed: ${error.message}`,
                'DECRYPTION_FAILED'
            );
        }
    }
}
