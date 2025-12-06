import { EntitySchema } from "typeorm";
import { SessionRecord } from "../../Domain/Encryption/SessionRecord.js";
import { BaseSchema } from "./BaseSchema.js";

export const SessionRecordSchema = new EntitySchema<SessionRecord>({
  name: "SessionRecord",
  target: SessionRecord,
  columns: {
    ...BaseSchema.columns,
    encodedAddress: {
      type: String,
      primary: true,
    },
    record: {
      type: String, 
    },
  },
});
