import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class SearchHistoryAnalytics20260828210000 implements MigrationInterface {
  name = 'SearchHistoryAnalytics20260828210000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'search_history',
      'FK_search_history_user_id',
    );

    await queryRunner.changeColumn(
      'search_history',
      'user_id',
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'search_history',
      new TableColumn({
        name: 'travel_month',
        type: 'char',
        length: '7',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'search_history',
      new TableForeignKey({
        name: 'FK_search_history_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createIndex(
      'search_history',
      new TableIndex({
        name: 'IDX_search_history_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'search_history',
      new TableIndex({
        name: 'IDX_search_history_destination_iata',
        columnNames: ['destination_iata'],
      }),
    );

    await queryRunner.createIndex(
      'search_history',
      new TableIndex({
        name: 'IDX_search_history_origin_iata',
        columnNames: ['origin_iata'],
      }),
    );

    await queryRunner.createIndex(
      'search_history',
      new TableIndex({
        name: 'IDX_search_history_search_type',
        columnNames: ['search_type'],
      }),
    );

    await queryRunner.createIndex(
      'search_history',
      new TableIndex({
        name: 'IDX_search_history_travel_month',
        columnNames: ['travel_month'],
      }),
    );

    await queryRunner.createIndex(
      'search_history',
      new TableIndex({
        name: 'IDX_search_history_route',
        columnNames: ['origin_iata', 'destination_iata'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('search_history', 'IDX_search_history_route');
    await queryRunner.dropIndex(
      'search_history',
      'IDX_search_history_travel_month',
    );
    await queryRunner.dropIndex(
      'search_history',
      'IDX_search_history_search_type',
    );
    await queryRunner.dropIndex(
      'search_history',
      'IDX_search_history_origin_iata',
    );
    await queryRunner.dropIndex(
      'search_history',
      'IDX_search_history_destination_iata',
    );
    await queryRunner.dropIndex(
      'search_history',
      'IDX_search_history_created_at',
    );

    await queryRunner.dropForeignKey(
      'search_history',
      'FK_search_history_user_id',
    );

    await queryRunner.dropColumn('search_history', 'travel_month');

    await queryRunner.query(
      'DELETE FROM `search_history` WHERE `user_id` IS NULL',
    );

    await queryRunner.changeColumn(
      'search_history',
      'user_id',
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
        isNullable: false,
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
}
