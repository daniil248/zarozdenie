import { Injectable } from '@nestjs/common';

import { Prisma, User } from '@prisma/client';
import { PrismaService } from 'lib/prisma';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } });
  }
  async findByNumber(number: string): Promise<User | null> {
    return await this.prisma.user.findFirst({ where: { number } });
  }

  async registration(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({
      data,
    });
  }

  async updateStatus(userId: number, status: boolean) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        status: true,
        name: true,
        number: true,
        id: true,
      },
    });
  }

  async getAll() {
    return await this.prisma.user.findMany({
      where: {
        role: 'USER',
      },
      orderBy: {
        id: 'desc',
      },
      select: {
        status: true,
        name: true,
        number: true,
        id: true,
      },
    });
  }
}
