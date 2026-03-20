import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from 'src/auth.guard';
import { IsActiveGuard } from 'src/active.guard';
import { UserDecorator } from 'src/user/user.decorator';
import { User } from '@prisma/client';
import { IsAdminGuard } from 'src/admin.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard, IsActiveGuard)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @UserDecorator() user: User) {
    return this.orderService.create(user.id, createOrderDto);
  }

  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }
}
