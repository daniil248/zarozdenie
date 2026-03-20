import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { hash, verify } from 'argon2';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LangService } from 'lib/lang';
import { ChangeStatusDto } from './dto/change-status.dto';
import { ExistUserDto } from './dto/exist-user.dto';
import { BotService } from 'lib/bot';

@Injectable()
export class UserService {
  constructor(
    private readonly jwt: JwtService,
    private readonly userRepository: UserRepository,
    private readonly lang: LangService,
    private readonly botService: BotService,
  ) {}
  async registration(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findByNumber(createUserDto.number);
    if (user) {
      throw new BadRequestException(this.lang.message('global.user_found'));
    }
    const hashedPassword = await this.generateHashPassword(
      createUserDto.password,
    );

    const registeredUser = await this.userRepository.registration({
      number: createUserDto.number,
      name: createUserDto.name,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(registeredUser.id);

    delete registeredUser.password;

    await this.botService.send(
      `Зарегистрировался новый клиент\nИмя: ${registeredUser.name}\nНомер: ${registeredUser.number}\nПроверьте в панели администратора!!`,
    );

    return {
      user: registeredUser,
      ...tokens,
      message: this.lang.message('global.successful_reg'),
    };
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userRepository.findByNumber(loginUserDto.number);
    if (!user) {
      throw new BadRequestException(this.lang.message('global.user_not_found'));
    }

    const matchPassword = await verify(user.password, loginUserDto.password);
    if (!matchPassword) {
      throw new BadRequestException(
        this.lang.message('global.password_incorrect'),
      );
    }

    const tokens = await this.generateTokens(user.id);
    return {
      user,
      ...tokens,
      message: this.lang.message('global.successful_login'),
    };
  }

  async getAll() {
    const users = await this.userRepository.getAll();
    return users;
  }

  async exist(existUserDto: ExistUserDto) {
    const user = await this.userRepository.findByNumber(existUserDto.number);
    if (!user) {
      return {
        exist: false,
      };
    }
    return {
      exist: true,
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const verifyUser = await this.jwt.verifyAsync(refreshTokenDto.token);
    if (!verifyUser) {
      throw new BadRequestException(this.lang.message('global.user_not_found'));
    }

    const user = await this.userRepository.findById(verifyUser.id);

    delete user.password;

    const tokens = await this.generateTokens(user.id);

    return {
      user: user,
      ...tokens,
    };
  }

  async changeStatus(changeStatusDto: ChangeStatusDto) {
    const user = await this.userRepository.findById(changeStatusDto.userId);
    if (!user) {
      throw new BadRequestException(this.lang.message('global.user_not_found'));
    }

    const updatedUser = await this.userRepository.updateStatus(
      user.id,
      !user.status,
    );

    return updatedUser;
  }

  private async generateHashPassword(password: string) {
    try {
      const hashedPassword = await hash(password);
      return hashedPassword;
    } catch (e) {
      throw new this.lang.somethingError();
    }
  }

  private async generateTokens(userId: number) {
    const data = { id: userId };
    const accessToken = this.jwt.sign(data, {
      expiresIn: '1d',
    });
    const refreshToken = this.jwt.sign(data, {
      expiresIn: '30d',
    });
    return { accessToken, refreshToken };
  }
}
