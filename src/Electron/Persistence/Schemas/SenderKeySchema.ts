import { EntitySchema } from "typeorm";
import { SenderKey } from "../../Domain/Encryption/SenderKey.js";
import { BaseSchema } from "./BaseSchema.js";

export const SenderKeySchema = new EntitySchema<SenderKey>({
  name: "SenderKey",
  target: SenderKey,
  columns: {
    ...BaseSchema.columns,
    groupId: {
      type: String,
      primary: true,
      length: 255,
    },
    connectionId: {
      type: String,
      primary: true,
      length: 255,
    },
    record: {
      type: "blob",
    },
  },
});
