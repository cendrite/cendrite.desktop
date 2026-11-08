import { EntitySchema } from "typeorm";
import { PinnedAccountKey } from "#electron/Domain/Encryption/PinnedAccountKey";
import { BaseSchema } from "./BaseSchema.js";

export const PinnedAccountKeySchema = new EntitySchema<PinnedAccountKey>({
  name: "PinnedAccountKey",
  target: PinnedAccountKey,
  columns: {
    ...BaseSchema.columns,
    userTag: {
      type: String,
      primary: true,
      length: 12,
    },
    accountPublicKey: {
      type: String,
      length: 64,
    },
    timestamp: {
      type: Number,
    },
  },
});
