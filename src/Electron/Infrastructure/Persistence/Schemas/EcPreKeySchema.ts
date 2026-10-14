import { EntitySchema } from "typeorm";
import { EcPreKey } from "#electron/Domain/Encryption/EcPreKey";
import { BaseSchema } from "./BaseSchema.js";

export const EcPreKeySchema = new EntitySchema<EcPreKey>({
  name: 'EcPreKey',
  target: EcPreKey,
  columns: {
    ...BaseSchema.columns,
    id: {
      type: 'integer',
      primary: true,
    },
    publicKey: {
      type: 'blob',
      nullable: false,
    },
    privateKey: {
      type: 'blob',
      nullable: false,
    },
    consumed: {
      type: 'boolean',
      default: false,
    },
  },
})
