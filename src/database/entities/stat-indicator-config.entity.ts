import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stat_indicator_configs')
export class StatIndicatorConfig {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'question_key', type: 'varchar', length: 100 })
  questionKey: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label: string;

  @Column({ name: 'show_in_chart', type: 'tinyint', default: 0 })
  showInChart: number;

  @Column({
    name: 'chart_type',
    type: 'enum',
    enum: ['pie', 'column'],
    nullable: true,
  })
  chartType: 'pie' | 'column';

  @Column({ name: 'report_template', type: 'varchar', length: 20, nullable: true })
  reportTemplate: string;

  @Column({ name: 'excel_column', type: 'varchar', length: 50, nullable: true })
  excelColumn: string;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
