import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('course_requests')
export class CourseRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 200 })
  fullName: string;

  @Column({ type: 'nvarchar', length: 200 })
  email: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  phone?: string;

  @Column({ type: 'nvarchar', length: 200 })
  courseName: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  message?: string;

  @Column({ default: 'new' })
  status: 'new' | 'reviewed' | 'accepted' | 'rejected';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
