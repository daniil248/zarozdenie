import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { LangService } from 'lib/lang';
import { FileService } from 'lib/file';
import { ProductRepository } from './product.repository';
import { Product } from '@prisma/client';
import { BotService } from 'lib/bot';

@Injectable()
export class ProductService {
  constructor(
    private readonly lang: LangService,
    private readonly fileService: FileService,
    private readonly productRepository: ProductRepository,
    private readonly botService: BotService,
  ) {}
  async create(createProductDto: CreateProductDto) {
    const files = await this.fileService.saveFiles(createProductDto.images);
    if (!files) {
      throw new BadRequestException(
        this.lang.message('global.cannot_save_photo'),
      );
    }

    if (this.lang.getLocale() == 'en') {
      const product = await this.productRepository.create({
        images: files,
        number: createProductDto.number,
        age: createProductDto.age,
        weight: createProductDto.weight,
        height: createProductDto.height,
        has_twins: createProductDto.has_twins,
        menstrual_cycle: createProductDto.menstrual_cycle,
        name_en: createProductDto.name,
        nationality_en: createProductDto.nationality,
        eye_color_en: createProductDto.eye_color,
        hair_color_en: createProductDto.hair_color,
        habits_en: createProductDto.habits,
        country_en: createProductDto.country,
        religion_en: createProductDto.religion,
        profession_en: createProductDto.profession,
        allergies_en: createProductDto.allergies,
        chronic_diseases_en: createProductDto.chronic_diseases,
        reproductive_history_en: createProductDto.reproductive_history,
        pregnancy_outcome_en: createProductDto.pregnancy_outcome,
        contraceptive_use_en: createProductDto.contraceptive_use,
        health_problems_en: createProductDto.health_problems,
        family_medical_history_en: createProductDto.family_medical_history,
        additional_info_en: createProductDto.additional_info,
        genetic_history_en: createProductDto.genetic_history,
        email: createProductDto.email,
        city_en: createProductDto.city,
        resus_en: createProductDto.resus,
        blood_type_en: createProductDto.blood_type,
        childrens_en: createProductDto.childrens,
        education_en: createProductDto.education,
      });

      try {
        await this.botService.send(
          `Поступила новая анкета\nИмя: ${product.name_en}\nНомер: ${product.number}\nПроверьте её в панели администратора!!`,
        );
      } catch {
        // Уведомление в Telegram не критично — анкета уже сохранена
      }

      return {
        product: product,
        message: this.lang.message('global.successful_create'),
      };
    }
    const product = await this.productRepository.create({
      images: files,
      number: createProductDto.number,
      age: createProductDto.age,
      weight: createProductDto.weight,
      height: createProductDto.height,
      has_twins: createProductDto.has_twins,
      menstrual_cycle: createProductDto.menstrual_cycle,
      name: createProductDto.name,
      nationality: createProductDto.nationality,
      eye_color: createProductDto.eye_color,
      hair_color: createProductDto.hair_color,
      habits: createProductDto.habits,
      country: createProductDto.country,
      religion: createProductDto.religion,
      profession: createProductDto.profession,
      allergies: createProductDto.allergies,
      chronic_diseases: createProductDto.chronic_diseases,
      reproductive_history: createProductDto.reproductive_history,
      pregnancy_outcome: createProductDto.pregnancy_outcome,
      contraceptive_use: createProductDto.contraceptive_use,
      health_problems: createProductDto.health_problems,
      family_medical_history: createProductDto.family_medical_history,
      additional_info: createProductDto.additional_info,
      genetic_history: createProductDto.genetic_history,
      email: createProductDto.email,
      city: createProductDto.city,
      resus: createProductDto.resus,
      blood_type: createProductDto.blood_type,
      childrens: createProductDto.childrens,
      education: createProductDto.education,
      ganorar: createProductDto.ganorar,
    });

    try {
      await this.botService.send(
        `Поступила новая анкета\nИмя: ${product.name}\nНомер: ${product.number}\nПроверьте её в панели администратора!!`,
      );
    } catch {
      // Уведомление в Telegram не критично — анкета уже сохранена
    }

    return {
      product: product,
      message: this.lang.message('global.successful_create'),
    };
  }

  async findAll(
    page: number,
    nationality: string,
    id: number,
    age: number,
    search?: string,
  ) {
    const searchValue = search?.trim();
    const searchNumber = searchValue ? Number(searchValue) : undefined;
    const searchIsNumber = !!searchValue && !Number.isNaN(searchNumber);

    const getCommonOrFilters = (locale: 'ru' | 'en') => {
      if (!searchValue) {
        return undefined;
      }

      const stringFields =
        locale === 'en'
          ? [
              { name_en: { contains: searchValue, mode: 'insensitive' as const } },
              {
                nationality_en: {
                  contains: searchValue,
                  mode: 'insensitive' as const,
                },
              },
              { city_en: { contains: searchValue, mode: 'insensitive' as const } },
              {
                profession_en: {
                  contains: searchValue,
                  mode: 'insensitive' as const,
                },
              },
              {
                eye_color_en: {
                  contains: searchValue,
                  mode: 'insensitive' as const,
                },
              },
              {
                hair_color_en: {
                  contains: searchValue,
                  mode: 'insensitive' as const,
                },
              },
            ]
          : [
              { name: { contains: searchValue, mode: 'insensitive' as const } },
              {
                nationality: {
                  contains: searchValue,
                  mode: 'insensitive' as const,
                },
              },
              { city: { contains: searchValue, mode: 'insensitive' as const } },
              {
                profession: {
                  contains: searchValue,
                  mode: 'insensitive' as const,
                },
              },
              { eye_color: { contains: searchValue, mode: 'insensitive' as const } },
              {
                hair_color: {
                  contains: searchValue,
                  mode: 'insensitive' as const,
                },
              },
            ];

      if (!searchIsNumber) {
        return stringFields;
      }

      return [...stringFields, { id: searchNumber }, { age: searchNumber }];
    };

    if (this.lang.getLocale() == 'en') {
      const filters = {
        nationality_en: {
          in: nationality ? nationality.split(',') : undefined,
        },
        id: id || undefined,
        age: age || undefined,
        OR: getCommonOrFilters('en'),
      };
      const products = await this.productRepository.findAll(page, filters);
      return products;
    }

    const filters = {
      nationality: {
        in: nationality ? nationality.split(',') : undefined,
      },
      id: id || undefined,
      age: age || undefined,
      OR: getCommonOrFilters('ru'),
    };
    const products = await this.productRepository.findAll(page, filters);
    return products;
  }

  async findAllAdmin(page: number) {
    const products = await this.productRepository.findAllAdmin(page);
    return products;
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne(id);
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    let files: string[] = [];
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException(this.lang.message('global.not_found'));
    }

    if (product.images && updateProductDto.images) {
      await this.fileService.removeMany(product.images);
    }

    if (updateProductDto.images) {
      const filesSaved = await this.fileService.saveFiles(
        updateProductDto.images,
      );
      if (!filesSaved) {
        throw new BadRequestException(
          this.lang.message('global.cannot_save_photo'),
        );
      }

      files = filesSaved;
    }

    const updateProduct = await this.productRepository.update(id, {
      images: files.length > 0 ? files : undefined,
      number: updateProductDto.number,
      age: updateProductDto.age,
      weight: updateProductDto.weight,
      height: updateProductDto.height,
      has_twins: updateProductDto.has_twins,
      menstrual_cycle: updateProductDto.menstrual_cycle,
      has_twins_en: updateProductDto.has_twins_en,
      menstrual_cycle_en: updateProductDto.menstrual_cycle_en,
      name: updateProductDto.name,
      name_en: updateProductDto.name_en,
      nationality: updateProductDto.nationality,
      nationality_en: updateProductDto.nationality_en,
      eye_color: updateProductDto.eye_color,
      eye_color_en: updateProductDto.eye_color_en,
      hair_color: updateProductDto.hair_color,
      hair_color_en: updateProductDto.hair_color_en,
      habits: updateProductDto.habits,
      habits_en: updateProductDto.habits_en,
      country: updateProductDto.country,
      country_en: updateProductDto.country_en,
      religion: updateProductDto.religion,
      religion_en: updateProductDto.religion_en,
      profession: updateProductDto.profession,
      profession_en: updateProductDto.profession_en,
      allergies: updateProductDto.allergies,
      allergies_en: updateProductDto.allergies_en,
      chronic_diseases: updateProductDto.chronic_diseases,
      chronic_diseases_en: updateProductDto.chronic_diseases_en,
      reproductive_history: updateProductDto.reproductive_history,
      reproductive_history_en: updateProductDto.reproductive_history_en,
      pregnancy_outcome: updateProductDto.pregnancy_outcome,
      pregnancy_outcome_en: updateProductDto.pregnancy_outcome_en,
      contraceptive_use: updateProductDto.contraceptive_use,
      contraceptive_use_en: updateProductDto.contraceptive_use_en,
      health_problems: updateProductDto.health_problems,
      health_problems_en: updateProductDto.health_problems_en,
      family_medical_history: updateProductDto.family_medical_history,
      family_medical_history_en: updateProductDto.family_medical_history_en,
      additional_info: updateProductDto.additional_info,
      additional_info_en: updateProductDto.additional_info_en,
      genetic_history: updateProductDto.genetic_history,
      genetic_history_en: updateProductDto.genetic_history_en,
      city: updateProductDto.city,
      city_en: updateProductDto.city_en,
      resus: updateProductDto.resus,
      resus_en: updateProductDto.resus_en,
      blood_type: updateProductDto.blood_type,
      blood_type_en: updateProductDto.blood_type_en,
      childrens: updateProductDto.childrens,
      childrens_en: updateProductDto.childrens_en,
      education: updateProductDto.education,
      education_en: updateProductDto.education_en,
      ganorar: updateProductDto.ganorar,
    });

    return {
      product: updateProduct,
      message: this.lang.message('global.successful_update'),
    };
  }

  async changeStatus(id: number) {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException(this.lang.message('global.not_found'));
    }

    const updatedProduct = await this.productRepository.update(id, {
      status: !product.status,
    });

    return updatedProduct;
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException(this.lang.message('global.not_found'));
    }

    const removedProduct = await this.productRepository.remove(id);
    return removedProduct;
  }

  getUniqueValues(arr: Product[], key: string) {
    const uniqueValuesSet = new Set();
    const uniqueValuesArray = [];

    for (const item of arr) {
      const value = item[key];

      if (value !== null) {
        if (!uniqueValuesSet.has(value)) {
          uniqueValuesSet.add(value);
          uniqueValuesArray.push(value);
        }
      }
    }

    return uniqueValuesArray;
  }
  async getFilters() {
    const products = await this.productRepository.findAllWithoutPagination();
    const locale = this.lang.getLocale();
    // Преобразуем Set обратно в массив
    const uniqueNationality = this.getUniqueValues(
      products,
      locale == 'ru' ? 'nationality' : 'nationality_en',
    );

    return {
      nationality: uniqueNationality,
    };
  }
}
