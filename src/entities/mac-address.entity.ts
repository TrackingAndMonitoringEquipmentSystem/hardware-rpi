import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mac_address' })
export class MacAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'mac_address', nullable: false, unique: true })
  macAddress: string;
}
