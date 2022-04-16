import {MigrationInterface, QueryRunner} from "typeorm";

export class initialLocker1649944969269 implements MigrationInterface {
    name = 'initialLocker1649944969269'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`locker\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NULL, \`description\` varchar(255) NULL, \`location\` varchar(255) NULL, \`total_equipment\` int NULL, \`status\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`locker\``);
    }

}
