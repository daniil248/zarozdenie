import { Type } from 'class-transformer';
import { IsNotEmpty, IsInt, IsOptional, IsString } from 'class-validator';
import {
  HasMimeType,
  IsFiles,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';

export class CreateProductDto {
  @IsFiles()
  @MaxFileSize(30e6, { each: true })
  @HasMimeType(['image/jpeg', 'image/png'], { each: true })
  images: MemoryStoredFile[];

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  age: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  weight: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  height: number;

  @IsString()
  @IsNotEmpty()
  has_twins: string;

  @IsString()
  @IsOptional()
  has_twins_en: string;

  @IsString()
  @IsNotEmpty()
  menstrual_cycle: string;

  @IsString()
  @IsOptional()
  menstrual_cycle_en: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  city_en: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  name_en: string;

  @IsString()
  @IsNotEmpty()
  nationality: string;

  @IsOptional()
  @IsString()
  nationality_en: string;

  @IsString()
  @IsNotEmpty()
  eye_color: string;

  @IsOptional()
  @IsString()
  eye_color_en: string;

  @IsString()
  @IsNotEmpty()
  hair_color: string;

  @IsOptional()
  @IsString()
  hair_color_en: string;

  @IsString()
  @IsNotEmpty()
  habits: string;

  @IsOptional()
  @IsString()
  habits_en: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsOptional()
  @IsString()
  country_en: string;

  @IsString()
  @IsNotEmpty()
  religion: string;

  @IsOptional()
  @IsString()
  religion_en: string;

  @IsString()
  @IsNotEmpty()
  profession: string;

  @IsOptional()
  @IsString()
  profession_en: string;

  @IsString()
  @IsNotEmpty()
  allergies: string;

  @IsOptional()
  @IsString()
  allergies_en: string;

  @IsString()
  @IsNotEmpty()
  chronic_diseases: string;

  @IsOptional()
  @IsString()
  chronic_diseases_en: string;

  @IsString()
  @IsNotEmpty()
  reproductive_history: string;

  @IsString()
  @IsOptional()
  reproductive_history_en: string;

  @IsString()
  @IsNotEmpty()
  pregnancy_outcome: string;

  @IsOptional()
  @IsString()
  pregnancy_outcome_en: string;

  @IsString()
  @IsNotEmpty()
  contraceptive_use: string;

  @IsOptional()
  @IsString()
  contraceptive_use_en: string;

  @IsString()
  @IsNotEmpty()
  health_problems: string;

  @IsOptional()
  @IsString()
  health_problems_en: string;

  @IsString()
  @IsNotEmpty()
  family_medical_history: string;

  @IsOptional()
  @IsString()
  family_medical_history_en: string;

  @IsString()
  @IsNotEmpty()
  additional_info: string;

  @IsOptional()
  @IsString()
  additional_info_en: string;

  @IsString()
  @IsNotEmpty()
  genetic_history: string;

  @IsString()
  @IsOptional()
  genetic_history_en: string;

  @IsString()
  @IsNotEmpty()
  resus: string;

  @IsString()
  @IsOptional()
  resus_en: string;

  @IsString()
  @IsNotEmpty()
  blood_type: string;

  @IsString()
  @IsOptional()
  blood_type_en: string;

  @IsString()
  @IsNotEmpty()
  childrens: string;

  @IsString()
  @IsOptional()
  childrens_en: string;

  @IsString()
  @IsNotEmpty()
  education: string;

  @IsString()
  @IsOptional()
  education_en: string;

  @IsString()
  @IsOptional()
  ganorar: string;
}
