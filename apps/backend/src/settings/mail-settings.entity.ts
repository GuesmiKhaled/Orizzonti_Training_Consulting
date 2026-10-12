import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('mail_settings')
export class MailSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'smtp.example.com' })
  host: string;

  @Column({ default: 587 })
  port: number;

  @Column({ default: 'info@orizzonti.tn' })
  username: string;

  @Column({ default: '' })
  password: string;

  @Column({ default: 'info@orizzonti.tn' })
  fromAddress: string;

  @Column({ default: true })
  secure: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
