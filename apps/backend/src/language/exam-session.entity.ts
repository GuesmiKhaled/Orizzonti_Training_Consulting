import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LanguageLevel } from './language-level.entity';

@Entity('exam_sessions')
export class ExamSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  languageLevelId: number;

  @Column({ type: 'datetime' })
  examDate: Date;

  @Column({ nullable: true })
  location: string; // e.g., "Tunis"

  @Column({ type: 'datetime' })
  registrationStartDate: Date;

  @Column({ type: 'datetime' })
  registrationDeadline: Date;

  @Column({ nullable: true })
  price: string; // Can override level price

  @Column({ nullable: true })
  courseHours: string; // Can override level hours

  @Column({ nullable: true })
  subscriptionUrl: string; // Link to booking system

  @Column({ type: 'int', nullable: true })
  maxParticipants: number | null;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => LanguageLevel, (level) => level.examSessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'languageLevelId' })
  level: LanguageLevel;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
