-- 011: add 'education' product category (education & language-learning products)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check
  CHECK (category IN ('coding', 'llm', 'search', 'design', 'creative', 'enterprise', 'education', 'bundle'));
