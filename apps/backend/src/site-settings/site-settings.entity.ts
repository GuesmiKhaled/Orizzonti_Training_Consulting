import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Single-row table holding the public site's editable content. */
@Entity('site_settings')
export class SiteSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  heroTitle: string | null;

  @Column({ type: 'nvarchar', length: 300, nullable: true })
  heroSubtitle: string | null;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'nvarchar', length: 300, nullable: true })
  contactAddress: string | null;

  @Column({ type: 'nvarchar', length: 300, nullable: true })
  facebookUrl: string | null;

  @Column({ type: 'nvarchar', length: 300, nullable: true })
  instagramUrl: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  aboutText: string | null;

  @Column({ type: 'int', nullable: true })
  studentsCount: number | null;

  @Column({ type: 'int', nullable: true })
  coursesCount: number | null;

  @Column({ type: 'int', nullable: true })
  yearsOfExperience: number | null;

  @Column({ type: 'datetime', nullable: true })
  nextSessionDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
