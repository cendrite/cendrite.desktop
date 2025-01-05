import { Entity, Column, PrimaryColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class Device extends BaseEntity {

    @PrimaryColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true })
    privateKey!: string;

    @Column({ type: "text", unique: true })
    publicKey!: string;
}