import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'locker' })
export class Locker {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', nullable: true })
  name: string;

  @Column({ name: 'description', nullable: true })
  description: string;

  @Column({ name: 'location', nullable: true })
  location: string;

  @Column({ name: 'total_equipment', nullable: true })
  totalEquipment: number;

  @Column({ name: 'status', nullable: true })
  status: string;

}
