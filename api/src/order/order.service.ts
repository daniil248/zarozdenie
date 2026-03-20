import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { LangService } from 'lib/lang';
import { UserRepository } from 'src/user/user.repository';
import { ProductRepository } from 'src/product/product.repository';
import { OrderRepository } from './order.repository';
import { BotService } from 'lib/bot';

@Injectable()
export class OrderService {
  constructor(
    private readonly lang: LangService,
    private readonly userRepository: UserRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository,
    private readonly botService: BotService,
  ) {}
  async create(userId: number, createOrderDto: CreateOrderDto) {
    const product = await this.productRepository.findOne(
      createOrderDto.product_id,
    );

    const findOrder = await this.orderRepository.findByProductAndUserId(
      createOrderDto.product_id,
      userId,
    );
    if (findOrder) {
      throw new BadRequestException(this.lang.message('global.wait_order'));
    }

    if (!product) {
      throw new BadRequestException(this.lang.message('global.not_found'));
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestException(this.lang.message('global.not_found'));
    }

    const order = await this.orderRepository.create(userId, product.id);

    await this.botService.send(
      `Поступила новая заявка, проверьте её в панели администратора!!`,
    );

    return { order, message: this.lang.message('global.successful_order') };
  }

  async findAll() {
    const orders = await this.orderRepository.findAll();
    return orders;
  }

  async findOne(id: number) {
    const order = await this.orderRepository.findOne(id);
    return order;
  }

  async remove(id: number) {
    const order = await this.findOne(id);
    if (!order) {
      throw new BadRequestException(this.lang.message('global.not_found'));
    }
    const removedOrder = await this.orderRepository.remove(id);
    return {
      order: removedOrder,
      message: this.lang.message('global.successful_delete'),
    };
  }
}
