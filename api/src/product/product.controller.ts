import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth.guard';
import { IsActiveGuard } from 'src/active.guard';
import { IsAdminGuard } from 'src/admin.guard';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @FormDataRequest()
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get('filters/get')
  getFilters() {
    return this.productService.getFilters();
  }

  @UseGuards(JwtAuthGuard, IsActiveGuard)
  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('nationality') nationality?: string,
    @Query('id') id?: number,
    @Query('age') age?: number,
    @Query('search') search?: string,
  ) {
    return this.productService.findAll(page, nationality, id, age, search);
  }

  @UseGuards(JwtAuthGuard, IsActiveGuard)
  @Get('admin/product')
  findAllAdmin(@Query('page') page: number = 1) {
    return this.productService.findAllAdmin(page);
  }

  @UseGuards(JwtAuthGuard, IsActiveGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @FormDataRequest()
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }

  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @Patch('status/:id')
  changeStatus(@Param('id', ParseIntPipe) id: number) {
    return this.productService.changeStatus(id);
  }
}
