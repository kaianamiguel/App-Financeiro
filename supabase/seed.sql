-- Run this after creating your user account via Supabase Auth
-- Replace 'YOUR_USER_UUID' with your actual user ID from auth.users

-- Default budgets
insert into budgets (user_id, category, monthly_limit) values
  ('YOUR_USER_UUID', 'Mercado', 450),
  ('YOUR_USER_UUID', 'Saúde/Bem-estar', 430),
  ('YOUR_USER_UUID', 'Transporte/Carro', 300),
  ('YOUR_USER_UUID', 'Pets', 300),
  ('YOUR_USER_UUID', 'Telefone/Internet', 280),
  ('YOUR_USER_UUID', 'Assinaturas/Apps', 210),
  ('YOUR_USER_UUID', 'Compras/Vestuário', 150),
  ('YOUR_USER_UUID', 'Restaurante/Delivery', 100),
  ('YOUR_USER_UUID', 'Beleza/Cuidados', 50),
  ('YOUR_USER_UUID', 'Igreja/Doações', 30),
  ('YOUR_USER_UUID', 'Educação', 25),
  ('YOUR_USER_UUID', 'Transferências/Outros', 100),
  ('YOUR_USER_UUID', 'Outros', 75)
on conflict (user_id, category) do nothing;

-- Default settings
insert into settings (user_id, monthly_income, savings_goal)
values ('YOUR_USER_UUID', 7000, 4500)
on conflict (user_id) do nothing;
