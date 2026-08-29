import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class DestinationFlightableSearch20260828220000 implements MigrationInterface {
  name = 'DestinationFlightableSearch20260828220000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'destinations',
      new TableColumn({
        name: 'has_flightable_airport',
        type: 'tinyint',
        width: 1,
        default: 0,
      }),
    );

    await queryRunner.addColumn(
      'destinations',
      new TableColumn({
        name: 'airports',
        type: 'json',
        isNullable: true,
      }),
    );

    await queryRunner.createIndex(
      'destinations',
      new TableIndex({
        name: 'IDX_destinations_flightable_city',
        columnNames: ['has_flightable_airport', 'city_name'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'destinations',
      'IDX_destinations_flightable_city',
    );
    await queryRunner.dropColumn('destinations', 'airports');
    await queryRunner.dropColumn('destinations', 'has_flightable_airport');
  }
}
