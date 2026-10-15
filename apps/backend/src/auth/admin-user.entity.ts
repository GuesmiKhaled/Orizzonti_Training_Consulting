import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  fullName?: string | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  email?: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  phone?: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  mustChangePassword: boolean;

  @Column({ nullable: true })
  roleId?: number;

  @ManyToOne(() => Role, (role) => role.adminUsers, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'roleId' })
  role?: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
