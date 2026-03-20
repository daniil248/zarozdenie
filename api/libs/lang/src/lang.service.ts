import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class LangService {
  constructor(private readonly i18n: I18nService) {}

  message(message: string) {
    return this.i18n.t(message, { lang: I18nContext.current().lang });
  }

  somethingError() {
    throw new BadRequestException(
      this.i18n.t('global.something_error', {
        lang: I18nContext.current().lang,
      }),
    );
  }

  getLocale() {
    return I18nContext.current().lang;
  }
}
