-- Execute after creating your user in Supabase Auth.
-- Replace cc008921-929e-464b-9c8b-24c2439b7b85 with your actual user ID from auth.users table.

insert into budgets (user_id, category, monthly_limit) values
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Mercado', 450),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Saúde/Bem-estar', 430),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Transporte/Carro', 300),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Pets', 300),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Telefone/Internet', 280),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Assinaturas/Apps', 210),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Compras/Vestuário', 150),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Restaurante/Delivery', 100),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Beleza/Cuidados', 50),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Igreja/Doações', 30),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Educação', 25),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Transferências/Outros', 100),
  ('cc008921-929e-464b-9c8b-24c2439b7b85', 'Outros', 75)
on conflict (user_id, category) do nothing;

insert into settings (user_id, monthly_income, savings_goal)
values ('cc008921-929e-464b-9c8b-24c2439b7b85', 7000, 4500)
on conflict (user_id) do nothing;
