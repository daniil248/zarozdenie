-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Roles" NOT NULL DEFAULT 'USER',
    "status" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "number" TEXT NOT NULL,
    "images" TEXT[],
    "age" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "has_twins" TEXT NOT NULL,
    "menstrual_cycle" TEXT NOT NULL,
    "has_twins_en" TEXT,
    "menstrual_cycle_en" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "name_en" TEXT,
    "nationality" TEXT,
    "nationality_en" TEXT,
    "eye_color" TEXT,
    "eye_color_en" TEXT,
    "hair_color" TEXT,
    "hair_color_en" TEXT,
    "habits" TEXT,
    "habits_en" TEXT,
    "country" TEXT,
    "country_en" TEXT,
    "city" TEXT,
    "city_en" TEXT,
    "religion" TEXT,
    "religion_en" TEXT,
    "profession" TEXT,
    "profession_en" TEXT,
    "allergies" TEXT,
    "allergies_en" TEXT,
    "chronic_diseases" TEXT,
    "chronic_diseases_en" TEXT,
    "reproductive_history" TEXT,
    "reproductive_history_en" TEXT,
    "pregnancy_outcome" TEXT,
    "pregnancy_outcome_en" TEXT,
    "contraceptive_use" TEXT,
    "contraceptive_use_en" TEXT,
    "health_problems" TEXT,
    "health_problems_en" TEXT,
    "family_medical_history" TEXT,
    "family_medical_history_en" TEXT,
    "additional_info" TEXT,
    "additional_info_en" TEXT,
    "genetic_history" TEXT,
    "genetic_history_en" TEXT,
    "resus" TEXT,
    "resus_en" TEXT,
    "blood_type" TEXT,
    "blood_type_en" TEXT,
    "childrens" TEXT,
    "childrens_en" TEXT,
    "education" TEXT,
    "education_en" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_number_key" ON "User"("number");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
