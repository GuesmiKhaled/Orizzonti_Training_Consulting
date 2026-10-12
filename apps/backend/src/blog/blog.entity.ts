import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  excerpt: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  content: string;

  @Column({ nullable: true })
  slug: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
