
CREATE TABLE companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  contact_person TEXT,
  logo_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('Pote', 'Blister', 'Frasco')),
  value REAL NOT NULL,
  photo_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE price_lists (
  id TEXT PRIMARY KEY,
  company_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed')),
  discount_value REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE price_list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  price_list_id TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  adjusted_value REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_products_company_id ON products(company_id);
CREATE INDEX idx_price_lists_company_id ON price_lists(company_id);
CREATE INDEX idx_price_list_items_list_id ON price_list_items(price_list_id);
CREATE INDEX idx_price_list_items_product_id ON price_list_items(product_id);
