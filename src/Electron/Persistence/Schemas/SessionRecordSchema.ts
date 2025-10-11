import { EntitySchema } from "typeorm";
import { SessionRecord } from "../../Domain/Encryption/SessionRecord.js";
import { BaseSchema } from "./BaseSchema.js";

export const SessionRecordSchema = new EntitySchema<SessionRecord>({
  name: "SessionRecord",
  target: SessionRecord,
  columns: {
    ...BaseSchema.columns,
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
