import { EntitySchema } from "typeorm";
import {BaseSchema} from "./BaseSchema.js";
import {RefreshToken} from "../../../Domain/Entities/RefreshToken.js";

export const RefreshTokenSchema = new EntitySchema<RefreshToken>({
    name: "RefreshToken",
    target: RefreshToken,
    columns: {
        ...BaseSchema.columns,
        id: {
            primary: true,
            type: "uuid",
            generated: "uuid"
        },
        token: {
            type: "text",
            unique: true
        },
        expiresAt: {
            type: "text",
        }
    }
});