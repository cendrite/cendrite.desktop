import { Column } from "typeorm";

export abstract class BaseEntity {

    @Column()
    createdAt!: Date;

    @Column()
    updatedAt!: Date;
}