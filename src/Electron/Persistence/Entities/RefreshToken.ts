import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity.js";

@Entity()
export class RefreshToken extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text", unique: true })
    token!: string;

    @Column({
        type: "datetime", nullable: true,
        transformer: {
            to: (value: Date) => value,
            from: (value: string) => new Date(value)
        }
    })
    expiresAt!: Date;
}