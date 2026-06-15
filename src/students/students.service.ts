import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/database/entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  create(createStudentDto: CreateStudentDto) {
    const student = this.studentRepository.create(createStudentDto);
    return this.studentRepository.save(student);
  }

  // async findAll(query: any) {
  //   const page = Number(query.page ?? 0);
  //   const size = Number(query.size ?? 10);

  //   const [items, total] = await this.studentRepository.findAndCount({
  //     skip: page * size,
  //     take: size,
  //     order: { id: 'DESC' },
  //     relations: ['major'],
  //   });

  //   return {
  //     items,
  //     page,
  //     size,
  //     total,
  //     totalPages: Math.ceil(total / size),
  //   };
  // }
async findAll(query: any, currentUser?: any) {
  const page = Number(query.page ?? 0);
  const size = Number(query.size ?? 10);

  const qb = this.studentRepository.createQueryBuilder('student')
    .leftJoinAndSelect('student.major', 'major')
    .orderBy('student.id', 'DESC')
    .skip(page * size)
    .take(size);

  // thêm đoạn này
  if (!currentUser?.isAdmin && currentUser?.facultyId) {
    qb.andWhere('major.faculty_id = :facultyId', { 
      facultyId: currentUser.facultyId 
    });
  }

  const [items, total] = await qb.getManyAndCount();
  return { items, page, size, total, totalPages: Math.ceil(total / size) };
}
  async findOne(id: number) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['major'],
    });
    if (!student) throw new NotFoundException(`Không tìm thấy sinh viên #${id}`);
    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    await this.findOne(id);
    await this.studentRepository.update({ id }, updateStudentDto);
    return this.studentRepository.findOne({ where: { id }, relations: ['major'] });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.studentRepository.softDelete({ id });
  }
}
