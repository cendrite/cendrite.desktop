import {Column} from "typeorm";

export abstract class BaseEntity {

    @Column({
        type: "text",
        transformer: {
            to: (value: Date) => value,
            from: (value: string) => new Date(value)
        }
    })
    createdAt = new Date();

    @Column({
        type: "text", nullable: true,
        transformer: {
            to: (value: Date) => value,
            from: (value: string) => new Date(value)
        }
    })
    updatedAt?: Date;
}