import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExamSession } from './exam-session.entity';

export type ExamRegistrationStatus = 'pending' | 'accepted' | 'rejected';

@Entity('exam_registrations')
export class ExamRegistration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  examSessionId!: number;

  @Column({ type: 'nvarchar', length: 200 })
  fullName!: string;

  @Column({ type: 'nvarchar', length: 200 })
  email!: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  phone?: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  message?: string;

  @Column({ type: 'nvarchar', length: 20, default: 'pending' })
  status!: ExamRegistrationStatus;

  @ManyToOne(() => ExamSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examSessionId' })
  examSession!: ExamSession;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
