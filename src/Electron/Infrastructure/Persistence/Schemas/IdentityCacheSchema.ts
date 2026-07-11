import { EntitySchema } from "typeorm";
import { IdentityCache } from "../../../Domain/Encryption/IdentityCache.js";
import { BaseSchema } from "./BaseSchema.js";

export const IdentityCacheSchema = new EntitySchema<IdentityCache>({
  name: "IdentityCache",
  target: IdentityCache,
  columns: {
    ...BaseSchema.columns,
    encodedAddress: {
      type: String,
      primary: true,
      length: 255,
    },
    identityKeyPublic: {
      type: "blob",
    },
    trusted: {
      type: Boolean,
    },
    timestamp: {
      type: Number,
    },
  },
});
