import { EntitySchema } from "typeorm";
import { SignedPreKey } from "#electron/Domain/Encryption/SignedPreKey";
import { BaseSchema } from "./BaseSchema.js";


export const SignedPreKeySchema = new EntitySchema<SignedPreKey>({
    name: "SignedPreKey",
    target: SignedPreKey,
    columns: {
        ...BaseSchema.columns,
        keyId: {
            type: "integer",
            primary: true,
        },
        publicKey: {
            type: "blob",
            nullable: false,
        },
        privateKey: {
            type: "blob",
            nullable: false,
        },
        signature: {
            type: "blob",
            nullable: false,
        },
    },
});

