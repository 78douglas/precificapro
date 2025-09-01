import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import {
  authMiddleware,
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import {
  CreateCompanySchema,
  CreateProductSchema,
  UpdateProductPriceSchema,
  CreatePriceListSchema,
  type Product,
  type PublicPriceListView,
} from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Auth endpoints
app.get("/api/oauth/google/redirect_url", async (c) => {
  const redirectUrl = await getOAuthRedirectUrl("google", {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", zValidator("json", z.object({ code: z.string() })), async (c) => {
  const { code } = c.req.valid("json");

  const sessionToken = await exchangeCodeForSessionToken(code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  return c.json(user);
});

app.get("/api/logout", async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === "string") {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Company endpoints
app.get("/api/companies/me", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM companies WHERE user_id = ?"
  ).bind(user.id).all();

  return c.json(results[0] || null);
});

app.post("/api/companies", authMiddleware, zValidator("json", CreateCompanySchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  const companyData = c.req.valid("json");

  const { success, meta } = await c.env.DB.prepare(
    "INSERT INTO companies (user_id, name, phone, contact_person, logo_url, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
  ).bind(
    user.id,
    companyData.name,
    companyData.phone || null,
    companyData.contact_person || null,
    companyData.logo_url || null
  ).run();

  if (!success) {
    return c.json({ error: "Erro ao criar empresa" }, 500);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM companies WHERE id = ?"
  ).bind(meta.last_row_id).all();

  return c.json(results[0], 201);
});

app.put("/api/companies/me", authMiddleware, zValidator("json", CreateCompanySchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  const companyData = c.req.valid("json");

  const { success } = await c.env.DB.prepare(
    "UPDATE companies SET name = ?, phone = ?, contact_person = ?, logo_url = ?, updated_at = datetime('now') WHERE user_id = ?"
  ).bind(
    companyData.name,
    companyData.phone || null,
    companyData.contact_person || null,
    companyData.logo_url || null,
    user.id
  ).run();

  if (!success) {
    return c.json({ error: "Erro ao atualizar empresa" }, 500);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM companies WHERE user_id = ?"
  ).bind(user.id).all();

  return c.json(results[0]);
});

// Product endpoints
app.get("/api/products", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT p.* FROM products p
    JOIN companies c ON p.company_id = c.id
    WHERE c.user_id = ?
    ORDER BY p.created_at DESC
  `).bind(user.id).all();

  return c.json(results);
});

app.post("/api/products", authMiddleware, zValidator("json", CreateProductSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  const productData = c.req.valid("json");

  // Get user's company
  const { results: companies } = await c.env.DB.prepare(
    "SELECT id FROM companies WHERE user_id = ?"
  ).bind(user.id).all();

  if (companies.length === 0) {
    return c.json({ error: "Empresa não encontrada. Cadastre sua empresa primeiro." }, 400);
  }

  const companyId = companies[0].id;

  const { success, meta } = await c.env.DB.prepare(
    "INSERT INTO products (company_id, description, type, portion, value, manufacturer, photo_url, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))"
  ).bind(
    companyId,
    productData.description,
    productData.type,
    productData.portion || null,
    productData.value,
    productData.manufacturer || null,
    productData.photo_url || null
  ).run();

  if (!success) {
    return c.json({ error: "Erro ao criar produto" }, 500);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM products WHERE id = ?"
  ).bind(meta.last_row_id).all();

  return c.json(results[0], 201);
});

app.post("/api/products/import", authMiddleware, zValidator("json", z.object({
  products: z.array(z.object({
    foto: z.string(),
    produto: z.string(),
    tipo: z.enum(['Pote', 'Blister', 'Frasco']),
    porcao: z.string(),
    valor: z.number(),
    fabricante: z.enum(['União Flora', 'Force Sens']),
  }))
})), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  const { products: importedProducts } = c.req.valid("json");

  // Get user's company
  const { results: companies } = await c.env.DB.prepare(
    "SELECT id FROM companies WHERE user_id = ?"
  ).bind(user.id).all();

  if (companies.length === 0) {
    return c.json({ error: "Empresa não encontrada. Cadastre sua empresa primeiro." }, 400);
  }

  const companyId = companies[0].id;

  // Insert all products
  const insertPromises = importedProducts.map(product =>
    c.env.DB.prepare(
      "INSERT INTO products (company_id, description, type, portion, value, manufacturer, photo_url, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))"
    ).bind(
      companyId,
      product.produto,
      product.tipo,
      product.porcao || null,
      product.valor,
      product.fabricante,
      product.foto || null
    ).run()
  );

  try {
    await Promise.all(insertPromises);
    return c.json({ success: true, imported_count: importedProducts.length }, 201);
  } catch (error) {
    console.error('Erro ao importar produtos:', error);
    return c.json({ error: "Erro ao importar produtos" }, 500);
  }
});

app.put("/api/products/:id", authMiddleware, zValidator("json", CreateProductSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  const productId = c.req.param("id");
  const productData = c.req.valid("json");

  // Verify ownership
  const { results: products } = await c.env.DB.prepare(`
    SELECT p.id FROM products p
    JOIN companies c ON p.company_id = c.id
    WHERE p.id = ? AND c.user_id = ?
  `).bind(productId, user.id).all();

  if (products.length === 0) {
    return c.json({ error: "Produto não encontrado" }, 404);
  }

  const { success } = await c.env.DB.prepare(
    "UPDATE products SET description = ?, type = ?, portion = ?, value = ?, manufacturer = ?, photo_url = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(
    productData.description,
    productData.type,
    productData.portion || null,
    productData.value,
    productData.manufacturer || null,
    productData.photo_url || null,
    productId
  ).run();

  if (!success) {
    return c.json({ error: "Erro ao atualizar produto" }, 500);
  }

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM products WHERE id = ?"
  ).bind(productId).all();

  return c.json(results[0]);
});

app.delete("/api/products/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  const productId = c.req.param("id");

  // Verify ownership
  const { results: products } = await c.env.DB.prepare(`
    SELECT p.id FROM products p
    JOIN companies c ON p.company_id = c.id
    WHERE p.id = ? AND c.user_id = ?
  `).bind(productId, user.id).all();

  if (products.length === 0) {
    return c.json({ error: "Produto não encontrado" }, 404);
  }

  const { success } = await c.env.DB.prepare(
    "DELETE FROM products WHERE id = ?"
  ).bind(productId).run();

  if (!success) {
    return c.json({ error: "Erro ao deletar produto" }, 500);
  }

  return c.json({ success: true });
});

// Clear all products endpoint
app.delete("/api/products/clear", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  try {
    // Delete all price list items first (to avoid foreign key issues)
    await c.env.DB.prepare(`
      DELETE FROM price_list_items WHERE product_id IN (
        SELECT p.id FROM products p
        JOIN companies c ON p.company_id = c.id
        WHERE c.user_id = ?
      )
    `).bind(user.id).run();

    // Delete all products for the user's company
    const { success, meta } = await c.env.DB.prepare(`
      DELETE FROM products WHERE company_id IN (
        SELECT id FROM companies WHERE user_id = ?
      )
    `).bind(user.id).run();

    if (!success) {
      return c.json({ error: "Erro ao limpar produtos" }, 500);
    }

    return c.json({ success: true, deleted_count: meta.changes });
  } catch (error) {
    console.error('Erro ao limpar produtos:', error);
    return c.json({ error: "Erro ao limpar produtos" }, 500);
  }
});

// Price adjustment endpoints
app.post("/api/products/adjust-prices", authMiddleware, zValidator("json", UpdateProductPriceSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  const { product_ids, discount_type, discount_value } = c.req.valid("json");

  // Verify ownership of all products
  const placeholders = product_ids.map(() => "?").join(",");
  const { results: products } = await c.env.DB.prepare(`
    SELECT p.id, p.value FROM products p
    JOIN companies c ON p.company_id = c.id
    WHERE p.id IN (${placeholders}) AND c.user_id = ?
  `).bind(...product_ids, user.id).all();

  if (products.length !== product_ids.length) {
    return c.json({ error: "Alguns produtos não foram encontrados" }, 400);
  }

  // Calculate new prices and update
  const updates = products.map(product => {
    const originalValue = product.value as number;
    let newValue: number;

    if (discount_type === "percentage") {
      // Para porcentagem: valor negativo = desconto, valor positivo = acréscimo
      newValue = originalValue * (1 + discount_value / 100);
    } else {
      // Para valor fixo: valor negativo = desconto, valor positivo = acréscimo  
      newValue = originalValue + discount_value;
    }

    return { id: product.id, value: Math.max(0, newValue) };
  });

  // Update prices
  const updatePromises = updates.map(update =>
    c.env.DB.prepare(
      "UPDATE products SET value = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(update.value, update.id).run()
  );

  await Promise.all(updatePromises);

  return c.json({ success: true, updated_count: updates.length });
});

// Price list endpoints
app.post("/api/price-lists", authMiddleware, zValidator("json", CreatePriceListSchema), async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  const { name, product_ids, discount_type, discount_value } = c.req.valid("json");

  // Get user's company
  const { results: companies } = await c.env.DB.prepare(
    "SELECT id FROM companies WHERE user_id = ?"
  ).bind(user.id).all();

  if (companies.length === 0) {
    return c.json({ error: "Empresa não encontrada" }, 400);
  }

  const companyId = companies[0].id;

  // Generate unique ID for price list
  const listId = crypto.randomUUID();

  // Create price list
  const { success } = await c.env.DB.prepare(
    "INSERT INTO price_lists (id, company_id, name, discount_type, discount_value, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
  ).bind(listId, companyId, name, discount_type || null, discount_value).run();

  if (!success) {
    return c.json({ error: "Erro ao criar lista de preços" }, 500);
  }

  // Get products and calculate adjusted prices
  const placeholders = product_ids.map(() => "?").join(",");
  const { results: products } = await c.env.DB.prepare(`
    SELECT p.* FROM products p
    JOIN companies c ON p.company_id = c.id
    WHERE p.id IN (${placeholders}) AND c.user_id = ?
  `).bind(...product_ids, user.id).all();

  // Insert price list items
  const itemPromises = products.map(product => {
    const originalValue = (product as Product).value;
    let adjustedValue = originalValue;

    if (discount_type === "percentage") {
      // Para porcentagem: valor negativo = desconto, valor positivo = acréscimo
      adjustedValue = originalValue * (1 + discount_value / 100);
    } else if (discount_type === "fixed") {
      // Para valor fixo: valor negativo = desconto, valor positivo = acréscimo
      adjustedValue = originalValue + discount_value;
    }

    adjustedValue = Math.max(0, adjustedValue);

    return c.env.DB.prepare(
      "INSERT INTO price_list_items (price_list_id, product_id, adjusted_value, updated_at) VALUES (?, ?, ?, datetime('now'))"
    ).bind(listId, product.id, adjustedValue).run();
  });

  await Promise.all(itemPromises);

  return c.json({ 
    id: listId, 
    url: `${new URL(c.req.url).origin}/lista/${listId}`,
    success: true 
  }, 201);
});

app.get("/api/price-lists", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  
  const { results } = await c.env.DB.prepare(`
    SELECT pl.*, 
           (SELECT COUNT(*) FROM price_list_items pli WHERE pli.price_list_id = pl.id) as item_count
    FROM price_lists pl
    JOIN companies c ON pl.company_id = c.id
    WHERE c.user_id = ?
    ORDER BY pl.created_at DESC
  `).bind(user.id).all();

  return c.json(results);
});

app.delete("/api/price-lists/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }
  const listId = c.req.param("id");

  // Verify ownership
  const { results: priceLists } = await c.env.DB.prepare(`
    SELECT pl.id FROM price_lists pl
    JOIN companies c ON pl.company_id = c.id
    WHERE pl.id = ? AND c.user_id = ?
  `).bind(listId, user.id).all();

  if (priceLists.length === 0) {
    return c.json({ error: "Lista de preços não encontrada" }, 404);
  }

  // Delete price list items first
  await c.env.DB.prepare(
    "DELETE FROM price_list_items WHERE price_list_id = ?"
  ).bind(listId).run();

  // Delete price list
  const { success } = await c.env.DB.prepare(
    "DELETE FROM price_lists WHERE id = ?"
  ).bind(listId).run();

  if (!success) {
    return c.json({ error: "Erro ao deletar lista de preços" }, 500);
  }

  return c.json({ success: true });
});

// Public price list view
app.get("/api/price-lists/:id/public", async (c) => {
  const listId = c.req.param("id");

  const { results: priceLists } = await c.env.DB.prepare(`
    SELECT pl.*, c.name as company_name, c.phone, c.contact_person, c.logo_url
    FROM price_lists pl
    JOIN companies c ON pl.company_id = c.id
    WHERE pl.id = ?
  `).bind(listId).all();

  if (priceLists.length === 0) {
    return c.json({ error: "Lista de preços não encontrada" }, 404);
  }

  const priceList = priceLists[0];

  const { results: items } = await c.env.DB.prepare(`
    SELECT pli.adjusted_value, p.*
    FROM price_list_items pli
    JOIN products p ON pli.product_id = p.id
    WHERE pli.price_list_id = ?
    ORDER BY p.description
  `).bind(listId).all();

  const response: PublicPriceListView = {
    id: priceList.id as string,
    name: priceList.name as string,
    company: {
      name: priceList.company_name as string,
      phone: priceList.phone as string,
      contact_person: priceList.contact_person as string,
      logo_url: priceList.logo_url as string,
    },
    items: items.map(item => ({
      product: {
        id: item.id as number,
        company_id: item.company_id as number,
        description: item.description as string,
        type: item.type as "Pote" | "Blister" | "Frasco",
        portion: item.portion as string,
        value: item.value as number,
        manufacturer: item.manufacturer as "União Flora" | "Force Sens",
        photo_url: item.photo_url as string,
        created_at: item.created_at as string,
        updated_at: item.updated_at as string,
      },
      adjusted_value: item.adjusted_value as number,
    })),
    generated_at: new Date().toISOString(),
  };

  return c.json(response);
});

export default app;
