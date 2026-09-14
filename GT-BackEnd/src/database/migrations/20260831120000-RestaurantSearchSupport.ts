import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestaurantSearchSupport20260831120000 implements MigrationInterface {
  name = 'RestaurantSearchSupport20260831120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `search_history` MODIFY COLUMN `search_type` ENUM('destination','flight','hotel','currency','restaurant') NOT NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `api_cache` MODIFY COLUMN `provider` ENUM('travelpayouts','frankfurter','liteapi','google_places') NOT NULL",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DELETE FROM `search_history` WHERE `search_type` = 'restaurant'",
    );
    await queryRunner.query(
      "DELETE FROM `api_cache` WHERE `provider` = 'google_places'",
    );
    await queryRunner.query(
      "ALTER TABLE `search_history` MODIFY COLUMN `search_type` ENUM('destination','flight','hotel','currency') NOT NULL",
    );
    await queryRunner.query(
      "ALTER TABLE `api_cache` MODIFY COLUMN `provider` ENUM('travelpayouts','frankfurter','liteapi') NOT NULL",
    );
  }
}
