import z from "zod";

// Schemas de validação para a API
export const CompanySchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  phone: z.string().optional(),
  contact_person: z.string().optional(),
  logo_url: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const ProductSchema = z.object({
  id: z.number().optional(),
  company_id: z.number(),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(['Pote', 'Blister', 'Frasco']),
  portion: z.string().optional(),
  value: z.number().positive("Valor deve ser positivo"),
  manufacturer: z.enum(['União Flora', 'Force Sens']),
  photo_url: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const PriceListSchema = z.object({
  id: z.string(),
  company_id: z.number(),
  name: z.string().min(1, "Nome da lista é obrigatório"),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_value: z.number().default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const PriceListItemSchema = z.object({
  id: z.number().optional(),
  price_list_id: z.string(),
  product_id: z.number(),
  adjusted_value: z.number().positive(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Schemas para requests da API
export const CreateCompanySchema = CompanySchema.omit({ 
  id: true, 
  user_id: true, 
  created_at: true, 
  updated_at: true 
});

export const CreateProductSchema = ProductSchema.omit({ 
  id: true, 
  company_id: true, 
  created_at: true, 
  updated_at: true 
});

export const DiscountInputSchema = z.object({
  value: z.string().min(1, "Valor é obrigatório"),
  type: z.enum(['percentage', 'fixed']).optional(),
});

export const UpdateProductPriceSchema = z.object({
  product_ids: z.array(z.number()),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number(),
});

export const CreatePriceListSchema = z.object({
  name: z.string().min(1),
  product_ids: z.array(z.number()),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_value: z.number().default(0),
});

// Tipos derivados dos schemas
export type Company = z.infer<typeof CompanySchema>;
export type Product = z.infer<typeof ProductSchema>;
export type PriceList = z.infer<typeof PriceListSchema>;
export type PriceListItem = z.infer<typeof PriceListItemSchema>;

export type CreateCompany = z.infer<typeof CreateCompanySchema>;
export type CreateProduct = z.infer<typeof CreateProductSchema>;
export type UpdateProductPrice = z.infer<typeof UpdateProductPriceSchema>;
export type CreatePriceListRequest = z.infer<typeof CreatePriceListSchema>;
export type DiscountInput = z.infer<typeof DiscountInputSchema>;

// Tipos para visualização da lista pública
export interface PublicPriceListView {
  id: string;
  name: string;
  company: {
    name: string;
    phone?: string;
    contact_person?: string;
    logo_url?: string;
  };
  items: Array<{
    product: Product;
    adjusted_value: number;
  }>;
  generated_at: string;
}
