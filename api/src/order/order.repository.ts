import { Injectable } from '@nestjs/common';
import { Order } from '@prisma/client';

import { PrismaService } from 'lib/prisma';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(user_id: number, product_id: number): Promise<Order> {
    return await this.prisma.order.create({
      data: {
        user: {
          connect: {
            id: user_id,
          },
        },
        product: {
          connect: {
            id: product_id,
          },
        },
      },
    });
  }

  async findAll(): Promise<Order[]> {
    return await this.prisma.order.findMany({
      orderBy: {
        id: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            number: true,
          },
        },
        product: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });
  }

  async findOne(id: number): Promise<Order> {
    return await this.prisma.order.findFirst({ where: { id } });
  }
  async remove(id: number): Promise<Order> {
    return await this.prisma.order.delete({ where: { id } });
  }

  async findByProductAndUserId(product_id: number, user_id: number) {
    return await this.prisma.order.findFirst({
      where: {
        product_id,
        user_id,
      },
    });
  }
}
