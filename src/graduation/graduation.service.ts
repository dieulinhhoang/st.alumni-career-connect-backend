import { Injectable } from '@nestjs/common';
import { CreateGraduationDto } from './dto/create-graduation.dto';
import { UpdateGraduationDto } from './dto/update-graduation.dto';

@Injectable()
export class GraduationService {
  create(createGraduationDto: CreateGraduationDto) {
    return 'This action adds a new graduation';
  }

  findAll() {
    return `This action returns all graduation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} graduation`;
  }

  update(id: number, updateGraduationDto: UpdateGraduationDto) {
    return `This action updates a #${id} graduation`;
  }

  remove(id: number) {
    return `This action removes a #${id} graduation`;
  }
}
