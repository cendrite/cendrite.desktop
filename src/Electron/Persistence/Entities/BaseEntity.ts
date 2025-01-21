import { Column } from "typeorm";

export abstract class BaseEntity {

    @Column({
        type: "datetime",
        default: () => "CURRENT_TIMESTAMP",
        transformer: {
            to: (value: Date) => value,
            from: (value: string) => new Date(value)
        }
    })
    createdAt = Date;

    @Column({
        type: "datetime", nullable: true,
        transformer: {
            to: (value: Date) => value,
            from: (value: string) => new Date(value)
        }
    })
    updatedAt?: Date;
}