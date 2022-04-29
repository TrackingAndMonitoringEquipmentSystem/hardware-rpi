import {MigrationInterface, QueryRunner} from "typeorm";

export class AddMacAddressEntity1651189225680 implements MigrationInterface {
    name = 'AddMacAddressEntity1651189225680'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`mac_address\` (\`id\` int NOT NULL AUTO_INCREMENT, \`mac_address\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_5205c999c468c2b2a7fe7ee73f\` (\`mac_address\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`locker\` CHANGE \`name\` \`name\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`locker\` CHANGE \`description\` \`description\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`locker\` CHANGE \`location\` \`location\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`locker\` CHANGE \`total_equipment\` \`total_equipment\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`locker\` CHANGE \`status\` \`status\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`locker\` CHANGE \`status\` \`status\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`locker\` CHANGE \`total_equipment\` \`total_equipment\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`locker\` CHANGE \`location\` \`location\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`locker\` CHANGE \`description\` \`description\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`locker\` CHANGE \`name\` \`name\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`DROP INDEX \`IDX_5205c999c468c2b2a7fe7ee73f\` ON \`mac_address\``);
        await queryRunner.query(`DROP TABLE \`mac_address\``);
    }

}
