import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class Device extends BaseEntity {

    @PrimaryColumn({ type: "text" })
    id!: string;

    @Column({ type: "text", unique: true })
    privateKey!: string;

    @Column({ type: "text", unique: true })
    publicKey!: string;
}