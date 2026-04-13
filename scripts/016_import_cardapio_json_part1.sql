-- Importação parcial do cardápio (JSON part 1).
--
-- "Most Ordered" NÃO é categoria. Na app (menu), a secção no topo usa itens com
-- destaque = true (coluna itens_cardapio.destaque) — o admin marca no cadastro do item
-- (campo "Featured" / destaque).
--
-- Antes de correr (cardápio do zero):
--   DELETE FROM public.itens_cardapio;
--   DELETE FROM public.categorias;

BEGIN;

INSERT INTO public.categorias (id, nome, icone, ordem, ativo) VALUES
  ('cafe1001-0001-4001-8001-000000000001', 'Brazilian Easter Eggs (ovo de pascoa)', '🥚', 1, true),
  ('cafe1001-0001-4001-8001-000000000002', 'Breakfast', '🍳', 2, true),
  ('cafe1001-0001-4001-8001-000000000003', 'Pastry', '🥐', 3, true),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel', '🫓', 4, true),
  ('cafe1001-0001-4001-8001-000000000005', 'Desserts', '🍰', 5, true),
  ('cafe1001-0001-4001-8001-000000000006', 'Principal', '🍽️', 6, true),
  ('cafe1001-0001-4001-8001-000000000007', 'Specials of the day (Especiais do dia)', '📅', 7, true);

-- Brazilian Easter Eggs
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  (
    'cafe1001-0001-4001-8001-000000000001',
    'Serenata de amor 217g',
    'Celebrate Easter with our premium chocolate eggs featuring favorites like Garoto, Kinder, and Ferrero Rocher. Perfect for gifts or indulging in rich, high-quality chocolate. Celebre a Páscoa com nossos ovos de chocolate premium das marcas Garoto, Kinder e Ferrero Rocher. Perfeitos para presentear ou se deliciar com chocolates de alta qualidade.',
    29.99,
    NULL,
    true,
    false,
    1,
    NULL
  );

-- Breakfast
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-000000000002', 'Omelete served with French bread', 'Egg omelette with onions, bell peppers, cheese, served with a side of French bread.', 9.00, NULL, true, false, 1, NULL),
  ('cafe1001-0001-4001-8001-000000000002', 'Chocolate Quente', 'Hot chocolate', 3.00, NULL, true, false, 2, NULL),
  ('cafe1001-0001-4001-8001-000000000002', 'Ovos mexidos', 'Scrambled egg on French bread', 3.50, NULL, true, false, 3, NULL),
  ('cafe1001-0001-4001-8001-000000000002', 'Omelete de bacon com queijo', 'Bacon eggs omelet with cheese and french bread', 9.00, NULL, true, false, 4, NULL),
  ('cafe1001-0001-4001-8001-000000000002', 'Cappuccino', 'Classic espresso with steamed milk, topped with a layer of frothy foam.', 4.00, NULL, true, false, 5, NULL),
  ('cafe1001-0001-4001-8001-000000000002', 'Café com leite', 'Coffee with milk', 3.00, NULL, true, false, 6, NULL),
  ('cafe1001-0001-4001-8001-000000000002', 'Café', 'Regular coffee', 2.50, NULL, true, false, 7, 'Rating: 87% (8 reviews)'),
  ('cafe1001-0001-4001-8001-000000000002', 'Misto quente de queijo, presunto e tomate no pão francês', 'Ham, cheese and tomatoe on French bread', 6.50, NULL, true, false, 8, NULL),
  ('cafe1001-0001-4001-8001-000000000002', 'Misto quente presunto, queijo e tomate no pão francês', 'Ham, cheese, and tomato on French bread.', 5.00, NULL, true, false, 9, NULL),
  ('cafe1001-0001-4001-8001-000000000002', 'Misto quente de presunto, ovo e queijo no pão francês', 'Ham, egg and cheese on Franch bread', 7.00, NULL, true, false, 10, NULL),
  ('cafe1001-0001-4001-8001-000000000002', 'Pão com manteiga na chapa', 'Toasted bread with butter', 2.00, NULL, true, false, 11, NULL),
  ('cafe1001-0001-4001-8001-000000000002', 'Misto quente de bacon, ovo, tomate,presunto e queijo', 'Bacon, egg, ham and cheese on French bread', 8.00, NULL, true, false, 12, 'Rating: 100% (20 reviews)'),
  ('cafe1001-0001-4001-8001-000000000002', 'Cheese Bread (Pao de Queijo)', NULL, 1.00, NULL, true, false, 13, NULL),
  ('cafe1001-0001-4001-8001-000000000002', 'Enroladinho de queijo', 'Cheese roll typically includes a soft dough rolled with melted cheese.', 3.50, NULL, true, false, 14, NULL);

-- Pastry (Coxinha: destaque = aparece na secção do topo, ex. antigo "Most Ordered")
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-000000000003', 'Bolinho de Aipim/Mandioca', 'Yucca and ground beef', 6.00, NULL, true, false, 1, 'Rating: 75% (8 reviews)'),
  ('cafe1001-0001-4001-8001-000000000003', 'Coxinha', 'Brazilian pastry with chicken', 6.00, NULL, true, true, 2, 'Rating: 77% (79 reviews)'),
  ('cafe1001-0001-4001-8001-000000000003', 'Americano', 'Fried eggs, bacon, bread toast, and American coffee. A classic American breakfast in a pastry form.', 6.00, NULL, true, false, 3, NULL),
  ('cafe1001-0001-4001-8001-000000000003', 'Sferra de Frango', NULL, 5.00, NULL, true, false, 4, NULL),
  ('cafe1001-0001-4001-8001-000000000003', 'Sferra de Carne', 'Ground beef pastry typically filled with onions, olives, and spices.', 5.00, NULL, true, false, 5, NULL),
  ('cafe1001-0001-4001-8001-000000000003', 'Disco', 'Beef patty in a brazilian style', 6.50, NULL, true, false, 6, 'Rating: 100% (8 reviews)'),
  ('cafe1001-0001-4001-8001-000000000003', 'Enroladinho de salsicha', 'Sausage roll', 6.00, NULL, true, false, 7, 'Rating: 93% (15 reviews)'),
  ('cafe1001-0001-4001-8001-000000000003', 'Quibe', 'Ground beef and cheese', 5.00, NULL, true, false, 8, NULL),
  ('cafe1001-0001-4001-8001-000000000003', 'Risole de carne', 'Pastry with corn and beef', 6.00, NULL, true, false, 9, 'Rating: 80% (10 reviews)');

-- Pastel
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de Pizza', 'Cheese, Ham, Tomato and Oregano', 8.00, NULL, true, false, 1, 'Rating: 90% (11 reviews)'),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de Romeu e Julieta', 'Cheese with sweet guava paste', 8.00, NULL, true, false, 2, NULL),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de banana com canela', 'Banana with cinnamon', 8.00, NULL, true, false, 3, NULL),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de carne', 'Ground beef', 8.00, NULL, true, false, 4, 'Rating: 100% (9 reviews)'),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de carne com queijo', 'Ground beef with cheese', 8.00, NULL, true, false, 5, 'Rating: 75% (20 reviews)'),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de carne e queijo', 'Ground beef with cheese', 8.00, NULL, true, false, 6, 'Rating: 87% (8 reviews)'),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de frango com catupiry', 'Chicken with catupiry spread cheese', 8.00, NULL, true, false, 7, 'Rating: 71% (14 reviews)'),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de frango com catupiry', 'Chicken with spread cheese', 8.00, NULL, true, false, 8, 'Rating: 71% (14 reviews) · duplicate in source JSON'),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de frango com queijo', 'Chicken with cheese', 8.00, NULL, true, false, 9, NULL),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de frango com queijo', 'Chicken with cheese', 8.00, NULL, true, false, 10, 'duplicate in source JSON'),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de nutella com morango', 'Nutella with strawberry', 8.00, NULL, true, false, 11, NULL),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel de queijo', 'Cheese', 8.00, NULL, true, false, 12, 'Rating: 95% (21 reviews)'),
  ('cafe1001-0001-4001-8001-000000000004', 'Pastel queijo', 'Cheese', 8.00, NULL, true, false, 13, NULL);

-- Desserts (só bolos/mousse que estavam na lista "Most Ordered"; todos em destaque para a secção do topo)
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-000000000005', 'Carrot Brigadeiro cake', 'Moist carrot cake layered with a rich brigadeiro (Brazilian chocolate fudge) filling, typically finished with a smooth cream cheese frosting.', 6.00, NULL, true, true, 1, 'Popular: #2 Most liked · 96% (65 reviews)'),
  ('cafe1001-0001-4001-8001-000000000005', 'Passionfruit mousse', 'A light and airy dessert made with the tangy essence of passionfruit, typically includes whipped cream for a smooth texture.', 6.00, NULL, true, true, 2, 'Rating: 90% (22 reviews)'),
  ('cafe1001-0001-4001-8001-000000000005', 'Coconut cake(Bolo no pote de prestigio)', 'Chocolate and coconut cake', 6.00, NULL, true, true, 3, 'Rating: 90% (11 reviews)');

-- Principal (destaque = itens que figuravam em "Most Ordered" na origem)
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-000000000006', 'Sirloin Cap (Picanha)', 'Served with beans, rice, cassava flour, vinaigrette, french fries and salad', 20.99, NULL, true, true, 1, 'Popular: #1 Most liked · 90% (135 reviews)'),
  ('cafe1001-0001-4001-8001-000000000006', 'Sirloin Cap Special (Picanha Especial)', 'Top Sirloin cap, rice, yucca, banana, vinagrette, cassava flour, potato salad and beans.', 22.00, NULL, true, true, 2, 'Rating: 76% (13 reviews)'),
  ('cafe1001-0001-4001-8001-000000000006', 'Steak with Fried Egg on top (Bife à Cavalo)', 'Served with beans, rice, french fries and salad', 18.00, NULL, true, false, 3, 'Rating: 90% (11 reviews)'),
  ('cafe1001-0001-4001-8001-000000000006', 'Steak with Onions (Bife Acebolado)', 'Served with beans, rice, french fries and salad', 17.00, NULL, true, true, 4, 'Rating: 90% (43 reviews)'),
  ('cafe1001-0001-4001-8001-000000000006', 'Beef Parmegiana (Bife à Parmegiana)', 'Served with rice and french Fries', 18.00, NULL, true, false, 5, 'Rating: 81% (11 reviews)'),
  ('cafe1001-0001-4001-8001-000000000006', 'Pork steak (Bisteca)', 'Served with beans mixed with sausage, cassava flour and collard green, rice and mashed potatoes', 17.00, NULL, true, false, 6, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Fish Fillet (Tilápia com molho de Camarão)', 'Served with shrimp sauce, mashed potatoes, rice and salad', 17.00, NULL, true, false, 7, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Grilled Chicken Breast (Frango Grelhado)', 'Served with beans, rice, french fries and salad', 16.00, NULL, true, true, 8, 'Rating: 87% (49 reviews)'),
  ('cafe1001-0001-4001-8001-000000000006', 'Ground Beef Yucca Pie (Escondidinho de Carne Moída)', 'Served with rice and salad', 15.00, NULL, true, false, 9, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Beef Jerky Yucca Pie', 'Served with rice and salad', 16.00, NULL, true, false, 10, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Shrimp Yucca Pie', 'Served with rice and salad', 16.00, NULL, true, false, 11, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Bolognese Lasagne (Lasanha à Bolognese)', 'Served with rice and salad', 16.00, NULL, true, false, 12, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Chicken Lasagne (Lasanha de Frango)', 'Served with rice and salad', 16.00, NULL, true, false, 13, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Breaded Fish Fillet (Tilápia à Milanesa)', 'Served with beans, rice, french fries and salad', 16.00, NULL, true, false, 14, 'Rating: 100% (7 reviews)'),
  ('cafe1001-0001-4001-8001-000000000006', 'Breaded chicken breast (Frango à Milanesa)', 'Served with beans, rice, french fries and salad', 16.00, NULL, true, false, 15, 'Rating: 90% (10 reviews)'),
  ('cafe1001-0001-4001-8001-000000000006', 'Coulette beef with onions (Picanha Acebolada)', 'Served with beans, rice, fried yucca, fried banana, cassava flour, brazilian potato salad and vinaigrette', 22.00, NULL, true, true, 16, 'Popular: #3 Most liked · 91% (69 reviews)'),
  ('cafe1001-0001-4001-8001-000000000006', 'Chicken Yucca Pie (Escondidinho de Frango)', 'Served with rice and salad', 15.00, NULL, true, false, 17, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Ground beef Yucca Pie (Escondidinho de carne moida)', 'Served with rice and salad', 16.00, NULL, true, false, 18, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Breaded Steak (Bife à Milanesa)', 'Served with beans, rice, french fries and salad', 16.00, NULL, true, false, 19, 'Rating: 90% (10 reviews)'),
  ('cafe1001-0001-4001-8001-000000000006', 'Chicken Parmegiana (Frango à Parmegiana)', 'Served with rice and french fries', 17.00, NULL, true, false, 20, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Shrimp Yucca Pie (Escondidinho de Camarão)', 'Served with rice and salad', 14.00, NULL, true, false, 21, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Veggie Plate', 'Choice of 5 options including beans, collard greens, fried banana, fried egg, green salad, mashed potatoes, mayonnaise salad, rice, vinaigrette, and yucca.', 15.00, NULL, true, false, 22, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Rib eye steak', 'Rice, cassava flour, potato salad, plantain fried, French fries and beans', 21.99, NULL, true, false, 23, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Picanha BBQ', 'Top sirloin cap, Tuscan sausage, rice, tropeiro beans, fried yucca, fried plantain, potato salad, chimichurri.', 23.90, NULL, true, false, 24, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Picanha com piamontese', 'Tender top sirloin cap with creamy piedmont rice, cheese.', 21.00, NULL, true, false, 25, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Picanha com Catupiry', 'Tender sirloin cap with creamy cheese, served with rice and French fries.', 21.00, NULL, true, false, 26, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Picanha da casa', 'Top sirloin cap, rice, tropeiro beans, fried plantain, fried yucca, vinaigrette, green salad.', 22.90, NULL, true, false, 27, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'COSTELA ASSADA', 'Arroz, feijão tropeiro, mandioca, banana e vinagrete', 24.00, NULL, true, false, 28, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Espetinho de frango', 'Arroz, feijão tropeiro, mandioca , banana, vinagrete', 20.00, NULL, true, false, 29, NULL),
  ('cafe1001-0001-4001-8001-000000000006', 'Espetinho misto ( linguiça e carne)', 'Arroz, feijão tropeiro, mandioca , banana, vinagrete', 22.00, NULL, true, false, 30, NULL);

-- Specials of the day (Domingo = mesmo conceito do antigo "Most Ordered")
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-000000000007', 'Monday (segunda)', '1.Beef strogonoff (estrogonofe de carne) 2. Tilapia Moqueca(moqueca de tilapia) 3.beef stew (carne de panela )', 18.00, NULL, true, false, 1, 'Rating: 81% (27 reviews)'),
  ('cafe1001-0001-4001-8001-000000000007', 'Tuesday (terça)', 'Breaded Steak with Corn Cream (bife a milanesa com creme de milho) Pork Chop with Onions (bisteca acebolada) Breaded chicken(frango a milanesa )', 18.00, NULL, true, false, 2, 'Rating: 86% (15 reviews)'),
  ('cafe1001-0001-4001-8001-000000000007', 'Wednesday (quarta)', 'Steak with onion (bife acebolado) Roasted Pork Ribs (costelinha de porco assada) Parmegiana chicken (frango a parmegiana )', 18.00, NULL, true, false, 3, 'Rating: 100% (13 reviews)'),
  ('cafe1001-0001-4001-8001-000000000007', 'Thursday (Quinta)', 'Carne de Panela com legumes (beef stew with vegetables) Tilapia com molho tartaro (tilapia with tartar sauce ) Fried chicken (frango frito)', 18.00, NULL, true, false, 4, 'Rating: 100% (10 reviews)'),
  ('cafe1001-0001-4001-8001-000000000007', 'Friday (sexta)', '1. Parmegiana fish fillet ( tilapia a parmegiana) 2. Chicken strogonoff (strogonofe de frango) 3. Beef stew with Yucca (carne de panela c/ Mandioca)', 18.00, NULL, true, false, 5, 'Rating: 85% (7 reviews)'),
  ('cafe1001-0001-4001-8001-000000000007', 'Saturday (sábado)', '1-Black beans stew with linguiça &pork ribs (Feijoada) 2-Bobo de camarao 3-Fricasse de frango 4-Camarao internacional', 18.00, NULL, true, false, 6, 'Rating: 88% (18 reviews)'),
  ('cafe1001-0001-4001-8001-000000000007', 'Sunday (Domingo)', '1. Black Bean Stew with Linguiça and pork ribs (feijoada) 2. Camarão internacional 3- Fricassê de frango 4- Bobo de camarão', 18.00, NULL, true, true, 7, 'Rating: 96% (26 reviews)');

COMMIT;
