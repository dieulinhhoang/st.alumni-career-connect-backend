import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { Resource } from 'src/database/entities/resources.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private resourceRepository: Repository<Resource>,
  ) {}

  private normalizeResource(resource: Resource) {
    return {
      _id: String(resource.id),
      id: resource.id,
      code: resource.name ?? '',
      name: resource.name ?? '',
      actions: Array.isArray(resource.actions) ? resource.actions : [],
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
    };
  }

  async create(createResourceDto: CreateResourceDto) {
    const entity = this.resourceRepository.create({
      name: createResourceDto.name?.trim() || createResourceDto.code?.trim() || '',
      actions: Array.isArray(createResourceDto.actions)
        ? createResourceDto.actions.map((x) => x.trim()).filter(Boolean)
        : [],
    });

    const saved = await this.resourceRepository.save(entity);

    return {
      data: this.normalizeResource(saved),
      message: 'Tạo tài nguyên thành công',
    };
  }

  async findAll(query: any) {
    const page = Number(query.page ?? 0);
    const size = Number(query.size ?? 10);
    const name = query.name?.trim();
    const action = query.action?.trim();
    const code = query.code?.trim();

    const qb = this.resourceRepository.createQueryBuilder('resource');

    if (name) {
      qb.andWhere('resource.name LIKE :name', {
        name: `%${name}%`,
      });
    }

    if (code) {
      qb.andWhere('resource.name LIKE :code', {
        code: `%${code}%`,
      });
    }

    if (action) {
      qb.andWhere('resource.actions LIKE :action', {
        action: `%${action}%`,
      });
    }

    qb.orderBy('resource.id', 'DESC');
    qb.skip(page * size);
    qb.take(size);

    const [items, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / size);

    return {
      data: items.map((item) => this.normalizeResource(item)),
      items: items.map((item) => this.normalizeResource(item)),
      page: {
        total_elements: total,
        current_page: page + 1,
        total_pages: totalPages,
        has_next: page + 1 < totalPages,
        has_previous: page > 0,
      },
      total,
      totalPages,
    };
  }

  async findOne(id: number) {
    const resource = await this.resourceRepository.findOneBy({ id });

    if (!resource) {
      throw new NotFoundException('Không tìm thấy tài nguyên');
    }

    return {
      data: this.normalizeResource(resource),
    };
  }

  async update(id: number, updateResourceDto: UpdateResourceDto) {
    const resource = await this.resourceRepository.findOneBy({ id });

    if (!resource) {
      throw new NotFoundException('Không tìm thấy tài nguyên');
    }

    resource.name = updateResourceDto.name?.trim() || updateResourceDto.code?.trim() || resource.name;
    resource.actions = Array.isArray(updateResourceDto.actions)
      ? updateResourceDto.actions.map((x) => x.trim()).filter(Boolean)
      : [];

    const updated = await this.resourceRepository.save(resource);

    return {
      data: this.normalizeResource(updated),
      message: 'Cập nhật tài nguyên thành công',
    };
  }

  async remove(id: number) {
    const resource = await this.resourceRepository.findOneBy({ id });

    if (!resource) {
      throw new NotFoundException('Không tìm thấy tài nguyên');
    }

    await this.resourceRepository.delete({ id });

    return {
      message: 'Xoá tài nguyên thành công',
    };
  }
}