import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class Device extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    privateKey!: string;

    @Column()
    publicKey!: string;
}