import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from 'lib/prisma';
import { createPaginator } from 'prisma-pagination';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return await this.prisma.product.create({ data });
  }

  async findAll(page: number, filters: any) {
    const paginate = createPaginator({ perPage: 5 });

    return paginate(
      this.prisma.product,
      {
        where: {
          status: true,
          ...filters,
        },
        orderBy: { id: 'desc' },
      },
      {
        page,
      },
    );
  }
  async findAllAdmin(page: number) {
    const paginate = createPaginator({ perPage: 5 });

    return paginate(
      this.prisma.product,
      {
        orderBy: { id: 'desc' },
      },
      {
        page,
      },
    );
  }

  async findAllWithoutPagination() {
    return this.prisma.product.findMany({
      where: {
        status: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number): Promise<Product> {
    return await this.prisma.product.findFirst({ where: { id } });
  }

  async update(id: number, data: Prisma.ProductUpdateInput): Promise<Product> {
    return await this.prisma.product.update({ where: { id }, data });
  }
  async remove(id: number): Promise<Product> {
    return await this.prisma.product.delete({ where: { id } });
  }
}
