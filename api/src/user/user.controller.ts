import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Res,
  Get,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from 'src/auth.guard';
import { IsAdminGuard } from 'src/admin.guard';
import { ChangeStatusDto } from './dto/change-status.dto';
import { Response } from 'express';
import { ExistUserDto } from './dto/exist-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('registration')
  async registration(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const registration = await this.userService.registration(createUserDto);
    response.cookie('accessToken', registration.accessToken);
    response.cookie('refreshToken', registration.refreshToken);
    return registration;
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const login = await this.userService.login(loginUserDto);
    response.cookie('accessToken', login.accessToken);
    response.cookie('refreshToken', login.refreshToken);
    return login;
  }

  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @Get('')
  async getAll() {
    return this.userService.getAll();
  }

  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refresh = await this.userService.refresh(refreshTokenDto);
    response.cookie('accessToken', refresh.accessToken);
    response.cookie('refreshToken', refresh.refreshToken);
    return refresh;
  }

  @Post('exist')
  async exist(@Body() existUserDto: ExistUserDto) {
    return this.userService.exist(existUserDto);
  }

  @UseGuards(JwtAuthGuard, IsAdminGuard)
  @Patch('accept')
  changeStatus(@Body() changeStatusDto: ChangeStatusDto) {
    return this.userService.changeStatus(changeStatusDto);
  }
}
