import { Module } from '@nestjs/common';

import { UserModule } from './user/user.module';
import { I18nModule, QueryResolver } from 'nestjs-i18n';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { PrismaService } from 'lib/prisma';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..'),
      renderPath: 'uploads',
      exclude: ['/api/*'],
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.getOrThrow('FALLBACK_LANGUAGE'),
        loaderOptions: {
          path: join(__dirname, '/i18n/'),
          watch: true,
        },
      }),
      resolvers: [{ use: QueryResolver, options: ['lang'] }],
      inject: [ConfigService],
    }),
    UserModule,
    ProductModule,
    OrderModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
