import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EnterprisesService } from './enterprises.service';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';

@Controller('enterprises')
export class EnterprisesController {
  constructor(private readonly enterprisesService: EnterprisesService) {}

  @Post()
  create(@Body() createEnterpriseDto: CreateEnterpriseDto) {
    return this.enterprisesService.create(createEnterpriseDto);
  }

  @Get()
  findAll() {
    return this.enterprisesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enterprisesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnterpriseDto: UpdateEnterpriseDto) {
    return this.enterprisesService.update(+id, updateEnterpriseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enterprisesService.remove(+id);
  }
}
