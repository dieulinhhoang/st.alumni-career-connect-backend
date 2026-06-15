import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddFacultyIdToStudent1781540978174 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('student', new TableColumn({
      name: 'faculty_id',
      type: 'bigint',
      unsigned: true,
      isNullable: true,
    }));

    await queryRunner.query(`
      UPDATE student s
      JOIN major m ON m.id = s.training_industry_id
      SET s.faculty_id = m.faculty_id
    `);

    await queryRunner.createIndex('student', new TableIndex({
      name: 'idx_student_faculty',
      columnNames: ['faculty_id'],
    }));
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('student', 'idx_student_faculty');
    await queryRunner.dropColumn('student', 'faculty_id');
  }
}