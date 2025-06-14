export class Encryptor {
    private static instance: Encryptor;

    private constructor() {}

    public static getInstance(): Encryptor {
        if (!Encryptor.instance) {
            Encryptor.instance = new Encryptor();
        }
        return Encryptor.instance;
    }

    public decrypt(payload: string): {text: string, media: string | null} {
        return JSON.parse(payload);
    }
}