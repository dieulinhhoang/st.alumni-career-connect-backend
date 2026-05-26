import { Controller, Get, Post, Put, Patch, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { EnterprisesService } from './enterprises.service';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('enterprises')
@UseGuards(JwtAuthGuard)
export class EnterprisesController {
  constructor(private readonly enterprisesService: EnterprisesService) {}

  @Post()
  create(@Body() createEnterpriseDto: CreateEnterpriseDto) {
    return this.enterprisesService.create(createEnterpriseDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.enterprisesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enterprisesService.findOne(+id);
  }

  // FE dùng PUT để update toàn bộ enterprise
  @Put(':id')
  updatePut(@Param('id') id: string, @Body() updateEnterpriseDto: UpdateEnterpriseDto) {
    return this.enterprisesService.update(+id, updateEnterpriseDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEnterpriseDto: UpdateEnterpriseDto) {
    return this.enterprisesService.update(+id, updateEnterpriseDto);
  }

  // POST /enterprises/:id/verify
  @Post(':id/verify')
  verify(@Param('id') id: string) {
    return this.enterprisesService.verify(+id);
  }

  // PATCH /enterprises/:id/partner-status
  @Patch(':id/partner-status')
  setPartnerStatus(
    @Param('id') id: string,
    @Body('status') status: 'active' | 'inactive',
  ) {
    return this.enterprisesService.setPartnerStatus(+id, status);
  }

  // GET /enterprises/:id/jobs
  @Get(':id/jobs')
  getJobs(@Param('id') id: string, @Query() query: any) {
    return this.enterprisesService.getJobs(+id, query);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enterprisesService.remove(+id);
  }
}
