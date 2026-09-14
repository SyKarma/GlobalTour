import { MigrationInterface, QueryRunner } from 'typeorm';

export class CarSearchSupport20260831150000 implements MigrationInterface {
  name = 'CarSearchSupport20260831150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `search_history` MODIFY COLUMN `search_type` ENUM('destination','flight','hotel','currency','restaurant','car') NOT NULL",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DELETE FROM `search_history` WHERE `search_type` = 'car'",
    );
    await queryRunner.query(
      "ALTER TABLE `search_history` MODIFY COLUMN `search_type` ENUM('destination','flight','hotel','currency','restaurant') NOT NULL",
    );
  }
}
