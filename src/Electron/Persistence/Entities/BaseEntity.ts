import { Column } from "typeorm";

export abstract class BaseEntity {

    @Column({
        type: "datetime",
        transformer: {
            to: (value: Date) => value,
            from: (value: string) => new Date(value)
        }
    })
    createdAt = new Date();

    @Column({
        type: "datetime", nullable: true,
        transformer: {
            to: (value: Date) => value,
            from: (value: string) => new Date(value)
        }
    })
    updatedAt?: Date;
}