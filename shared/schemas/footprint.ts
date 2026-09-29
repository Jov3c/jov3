import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, 'Use a valid calendar date');
const idListSchema = z
  .array(z.string().uuid())
  .max(100)
  .refine((ids) => new Set(ids).size === ids.length, 'Media ids must be unique');

const localGeoJsonPathSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => !value.split(/[\\/]/).includes('..'), 'Path traversal is not allowed')
  .nullable();

const countryCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{2}$/, 'Use an ISO 3166-1 alpha-2 country code')
  .transform((value) => value.toUpperCase());

export const footprintCitySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase kebab-case slug'),
  countryCode: countryCodeSchema,
  countryName: z.string().trim().min(1).max(100),
  cityName: z.string().trim().min(1).max(120),
  regionName: z.string().trim().max(120).nullable(),
  geoProvider: z.string().trim().min(1).max(80),
  geoCode: z.string().trim().max(160).nullable(),
  localGeoJsonPath: localGeoJsonPathSchema,
  sortOrder: z.number().int().min(0).max(100_000),
});

export const footprintCityUpdateSchema = footprintCitySchema.partial();

export const footprintMemorySchema = z.object({
  cityId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(200_000),
  occurredOn: dateSchema.nullable(),
  sortOrder: z.number().int().min(0).max(100_000),
  visible: z.boolean(),
  mediaIds: idListSchema,
});

export const footprintMemoryUpdateSchema = footprintMemorySchema.partial();

export type FootprintCityInput = z.infer<typeof footprintCitySchema>;
export type FootprintCityUpdateInput = z.infer<typeof footprintCityUpdateSchema>;
export type FootprintMemoryInput = z.infer<typeof footprintMemorySchema>;
export type FootprintMemoryUpdateInput = z.infer<typeof footprintMemoryUpdateSchema>;
