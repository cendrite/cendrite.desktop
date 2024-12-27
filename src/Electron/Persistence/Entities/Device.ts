import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class Device extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "text" })
    privateKey!: string;

    @Column()
    publicKey!: string;
}