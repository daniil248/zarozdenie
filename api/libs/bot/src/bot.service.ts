import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);
  private BOT_URI: string;
  private CHAT_ID: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.BOT_URI = `https://api.telegram.org/bot${configService.get<string>(
      'TOKEN_BOT',
    )}/sendMessage`;
    this.CHAT_ID = this.configService.get<string>('CHAT_ID');
  }

  async send(message: string) {
    try {
      await this.httpService.axiosRef.post(this.BOT_URI, {
        chat_id: this.CHAT_ID,
        parse_mode: 'html',
        text: message,
      });
      return true;
    } catch (e) {
      this.logger.warn('Telegram notification failed, continuing request.');
      return false;
    }
  }
}
