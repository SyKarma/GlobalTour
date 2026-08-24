import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class InitialSchema20260821000000 implements MigrationInterface {
  name = 'InitialSchema20260821000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SET NAMES utf8mb4');

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'google_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'avatar_url',
            type: 'varchar',
            length: '512',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'user_preferences',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
            isUnique: true,
          },
          {
            name: 'preferred_currency',
            type: 'char',
            length: '3',
            default: "'USD'",
          },
          {
            name: 'home_city_iata',
            type: 'char',
            length: '3',
            isNullable: true,
          },
          {
            name: 'default_origin_iata',
            type: 'char',
            length: '3',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'destinations',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'city_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'country_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'country_code',
            type: 'char',
            length: '2',
          },
          {
            name: 'city_iata',
            type: 'char',
            length: '3',
            isUnique: true,
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 10,
            scale: 7,
            isNullable: true,
          },
          {
            name: 'timezone',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'destinations',
      new TableIndex({
        name: 'IDX_destinations_country_city',
        columnNames: ['country_code', 'city_name'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'wishlist_items',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'item_type',
            type: 'enum',
            enum: ['destination', 'flight', 'hotel'],
          },
          {
            name: 'destination_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'payload',
            type: 'json',
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'wishlist_items',
      new TableIndex({
        name: 'IDX_wishlist_items_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'search_history',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'search_type',
            type: 'enum',
            enum: ['destination', 'flight', 'hotel', 'currency'],
          },
          {
            name: 'origin_iata',
            type: 'char',
            length: '3',
            isNullable: true,
          },
          {
            name: 'destination_iata',
            type: 'char',
            length: '3',
            isNullable: true,
          },
          {
            name: 'query_json',
            type: 'json',
          },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'search_history',
      new TableIndex({
        name: 'IDX_search_history_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'api_cache',
        columns: [
          {
            name: 'cache_key',
            type: 'varchar',
            length: '128',
            isPrimary: true,
          },
          {
            name: 'provider',
            type: 'enum',
            enum: ['travelpayouts', 'frankfurter', 'liteapi'],
          },
          {
            name: 'payload',
            type: 'json',
          },
          {
            name: 'expires_at',
            type: 'datetime',
          },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'api_cache',
      new TableIndex({
        name: 'IDX_api_cache_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'currency_rates',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'rate_date',
            type: 'date',
          },
          {
            name: 'base_currency',
            type: 'char',
            length: '3',
          },
          {
            name: 'quote_currency',
            type: 'char',
            length: '3',
          },
          {
            name: 'rate',
            type: 'decimal',
            precision: 18,
            scale: 8,
          },
        ],
        uniques: [
          {
            name: 'UQ_currency_rates_date_pair',
            columnNames: ['rate_date', 'base_currency', 'quote_currency'],
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'user_preferences',
      new TableForeignKey({
        name: 'FK_user_preferences_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'wishlist_items',
      new TableForeignKey({
        name: 'FK_wishlist_items_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'wishlist_items',
      new TableForeignKey({
        name: 'FK_wishlist_items_destination_id',
        columnNames: ['destination_id'],
        referencedTableName: 'destinations',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'search_history',
      new TableForeignKey({
        name: 'FK_search_history_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('search_history');
    await queryRunner.dropTable('wishlist_items');
    await queryRunner.dropTable('user_preferences');
    await queryRunner.dropTable('currency_rates');
    await queryRunner.dropTable('api_cache');
    await queryRunner.dropTable('destinations');
    await queryRunner.dropTable('users');
  }
}
