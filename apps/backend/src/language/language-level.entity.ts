import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Language } from './language.entity';
import { ExamSession } from './exam-session.entity';

@Entity('language_levels')
export class LanguageLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  languageId: number;

  @Column()
  cefrLevel: string; // A1, A2, B1, B2, C1, C2

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  price: string; // e.g., "TND 500,00"

  @Column({ nullable: true })
  courseHours: string; // e.g., "66 hours"

  @ManyToOne(() => Language, (language) => language.levels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'languageId' })
  language: Language;

  @OneToMany(() => ExamSession, (session) => session.level, {
    cascade: true,
    eager: true,
  })
  examSessions: ExamSession[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
