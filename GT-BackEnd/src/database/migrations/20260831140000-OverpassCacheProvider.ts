import { MigrationInterface, QueryRunner } from 'typeorm';

export class OverpassCacheProvider20260831140000 implements MigrationInterface {
  name = 'OverpassCacheProvider20260831140000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `api_cache` MODIFY COLUMN `provider` ENUM('travelpayouts','frankfurter','liteapi','google_places','overpass') NOT NULL",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DELETE FROM `api_cache` WHERE `provider` = 'overpass'",
    );
    await queryRunner.query(
      "ALTER TABLE `api_cache` MODIFY COLUMN `provider` ENUM('travelpayouts','frankfurter','liteapi','google_places') NOT NULL",
    );
  }
}
