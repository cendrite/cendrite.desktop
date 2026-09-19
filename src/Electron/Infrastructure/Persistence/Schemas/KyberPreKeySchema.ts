import { EntitySchema } from "typeorm";
import { KyberPreKey } from "../../../Domain/Encryption/KyberPreKey.js";
import { BaseSchema } from "./BaseSchema.js";

export const KyberPreKeySchema = new EntitySchema<KyberPreKey>({
  name: 'KyberPreKey',
  target: KyberPreKey,
  columns: {
    ...BaseSchema.columns,
    id: {
      type: 'integer',
      primary: true,
    },
    record: {
      type: 'blob',
      nullable: false,
    },
  },
})
