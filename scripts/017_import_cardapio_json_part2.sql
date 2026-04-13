-- Importação cardápio JSON parte 2 (acompanha 016_import_cardapio_json_part1.sql).
--
-- Pressupõe que 016 já foi aplicado (categorias …000001–000007). Aqui:
--   - Novas categorias …000008–000015
--   - Doces extra na categoria Desserts existente (…000005), sem repetir os 3 já no 016
--
-- Antes (só se quiseres reimportar a parte 2):
--   DELETE FROM public.itens_cardapio WHERE categoria_id IN (
--     'cafe1001-0001-4001-8001-000000000008',
--     'cafe1001-0001-4001-8001-000000000009',
--     'cafe1001-0001-4001-8001-00000000000a',
--     'cafe1001-0001-4001-8001-00000000000b',
--     'cafe1001-0001-4001-8001-00000000000c',
--     'cafe1001-0001-4001-8001-00000000000d',
--     'cafe1001-0001-4001-8001-00000000000e',
--     'cafe1001-0001-4001-8001-00000000000f'
--   );
--   DELETE FROM public.categorias WHERE id IN (…mesmos UUIDs…);
--   (e remover manualmente da …000005 os itens desta parte se precisares)

BEGIN;

INSERT INTO public.categorias (id, nome, icone, ordem, ativo) VALUES
  ('cafe1001-0001-4001-8001-000000000008', 'Side Dishes', '🥬', 8, true),
  ('cafe1001-0001-4001-8001-000000000009', 'Beverages / Bebidas', '🥤', 9, true),
  ('cafe1001-0001-4001-8001-00000000000a', 'Drinks / wine / beer', '🍹', 10, true),
  ('cafe1001-0001-4001-8001-00000000000b', 'Smoothies', '🥤', 11, true),
  ('cafe1001-0001-4001-8001-00000000000c', 'Tigela De Açaí (Açai Bowl)', '🫐', 12, true),
  ('cafe1001-0001-4001-8001-00000000000d', 'Market (CACAU SHOW)', '🍫', 13, true),
  ('cafe1001-0001-4001-8001-00000000000e', 'Market Brasil Bistro', '🛒', 14, true),
  ('cafe1001-0001-4001-8001-00000000000f', 'Summer Menu', '☀️', 15, true);

-- Side Dishes (preço null no JSON → 3.00 na duplicata de couve)
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-000000000008', 'Beans (feijao)', 'Typically includes slow-cooked beans, often seasoned with garlic, onions, and herbs, offering a hearty and wholesome addition to your meal.', 3.00, NULL, true, false, 1, NULL),
  ('cafe1001-0001-4001-8001-000000000008', 'Rice (arroz)', 'Select five from: brown beans, collard greens, fried banana, fried egg, green salad, mashed potatoes, mayo salad, rice, vinaigrette, yucca.', 3.00, NULL, true, false, 2, NULL),
  ('cafe1001-0001-4001-8001-000000000008', 'Mashed Potatoes (pure)', 'Mashed potatoes: Potatoes that have been mashed and mixed with butter, milk, and seasoning.', 3.00, NULL, true, false, 3, NULL),
  ('cafe1001-0001-4001-8001-000000000008', 'Mayonnaise Salad', 'Mayonnaise salad: A blend of mixed greens, tomatoes, cucumbers, and onions typically dressed with creamy mayonnaise.', 3.00, NULL, true, false, 4, NULL),
  ('cafe1001-0001-4001-8001-000000000008', 'Fried Banana (Banana Fritta)', NULL, 3.00, NULL, true, false, 5, NULL),
  ('cafe1001-0001-4001-8001-000000000008', 'Tropeiro Beans (Feijao Tropeiro)', 'Tropeiro beans (feijão tropeiro): Typically includes red or black beans, sausage, bacon, collard greens, and eggs mixed together.', 3.00, NULL, true, false, 6, NULL),
  ('cafe1001-0001-4001-8001-000000000008', 'Vinaigrette Salad', 'Green salad with mixed greens, tomatoes, cucumbers, onions, and croutons, typically dressed with a house vinaigrette.', 3.00, NULL, true, false, 7, NULL),
  ('cafe1001-0001-4001-8001-000000000008', 'Collard Greens (Couve)', 'Typically includes sautéed collard greens with garlic and onions.', 3.00, NULL, true, false, 8, NULL),
  ('cafe1001-0001-4001-8001-000000000008', 'Collard Greens (Couve)', NULL, 3.00, NULL, true, false, 9, 'duplicate in source JSON'),
  ('cafe1001-0001-4001-8001-000000000008', 'Toasted Cassava Flour (Farofa)', 'Cassava flour, typically toasted until golden brown, often includes bits of bacon, onions, and herbs.', 2.50, NULL, true, false, 10, NULL),
  ('cafe1001-0001-4001-8001-000000000008', 'Fried Egg (ovo frito)', 'Crispy or soft fried eggs. Choose your style: Fried, Scrambled, Easy, Medium, or Hard.', 2.00, NULL, true, false, 11, NULL),
  ('cafe1001-0001-4001-8001-000000000008', 'Espetinho de queijo coalho', 'Espetinho de queijo coalho', 8.00, NULL, true, false, 12, NULL);

-- Beverages / Bebidas
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-000000000009', 'Diet Guarana', 'Guaraná soda with a tart and crisp taste, less sweet than typical soft drinks, offering a berry-like aftertaste.', 2.50, NULL, true, false, 1, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Cashew juice', 'Cajú', 7.00, NULL, true, false, 2, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Cupuaçu juice', 'A tropical beverage typically made from blended cupuaçu fruit, known for its unique tangy and slightly sweet flavor.', 7.00, NULL, true, false, 3, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Guava juice', 'Goiaba', 7.00, NULL, true, false, 4, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Mango juice', 'Manga', 6.00, NULL, true, false, 5, 'Rating: 83% (18 reviews)'),
  ('cafe1001-0001-4001-8001-000000000009', 'Passionfruit juice', 'Maracujá', 7.00, NULL, true, false, 6, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Pineaple juice', 'Abacaxi', 6.00, NULL, true, false, 7, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Pineaple with Mint juice', 'Abacaxi com hortelã', 6.00, NULL, true, false, 8, 'Rating: 100% (18 reviews)'),
  ('cafe1001-0001-4001-8001-000000000009', 'Acerola Cherry and Caja Plum juice', 'Acerola com cajá', 5.00, NULL, true, false, 9, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Acerola Cherry juice', 'Acerola', 7.00, NULL, true, false, 10, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Beer (Ultra)', 'Cerveja Ultra', 9.00, NULL, true, false, 11, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Bottled Water', 'Pure and refreshing bottled water.', 2.00, NULL, true, false, 12, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Caja juice', 'Caja juice is a refreshing beverage made from the tropical caja fruit, offering a unique and tangy flavor profile.', 7.00, NULL, true, false, 13, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Coke', 'Coca-cola', 2.50, NULL, true, false, 14, 'Rating: 95% (21 reviews)'),
  ('cafe1001-0001-4001-8001-000000000009', 'Coke Zero', 'The same great taste but with zero calories.', 3.00, NULL, true, false, 15, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Diet Coke', 'A crisp, refreshing taste you know and love with zero calories.', 3.00, NULL, true, false, 16, 'Rating: 100% (8 reviews)'),
  ('cafe1001-0001-4001-8001-000000000009', 'Guaraná', 'Guaraná juice is a refreshing beverage made from the crushed seeds of the guaraná plant, typically offering a slightly tart and sweet flavor profile.', 3.50, NULL, true, false, 17, 'Rating: 93% (47 reviews)'),
  ('cafe1001-0001-4001-8001-000000000009', 'Orange juice', 'fresh orange juice', 8.00, NULL, true, false, 18, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Orange with Acerola Cherry juice', 'Laranja com acerola', 7.00, NULL, true, false, 19, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Pepsi', 'The bold, refreshing, robust cola', 3.00, NULL, true, false, 20, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Sour Sop (Graviola) juice', 'Freshly extracted juice from the sour sop fruit, offering a unique, slightly tart taste.', 7.00, NULL, true, false, 21, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Sparkling water', 'Água com gás', 3.00, NULL, true, false, 22, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Sprite', 'The cold, refreshing flavors of lemon and lime, perfectly blended.', 3.00, NULL, true, false, 23, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Beer (Modelo)', 'Cerveja Modelo', 9.00, NULL, true, false, 24, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Beer (Heineken)', 'Cerveja Heineken', 9.00, NULL, true, false, 25, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Beer (Budlight)', 'Cerveja Budlight', 9.00, NULL, true, false, 26, NULL),
  ('cafe1001-0001-4001-8001-000000000009', 'Corona', 'Corona beer', 9.00, NULL, true, false, 27, NULL);

-- Drinks / wine / beer (caipirinhas, cocktails, cervejas e espumantes — duplicatas de cerveja vs Bebidas mantidas como na origem)
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-00000000000a', 'Caipirinha limao/ lime caipirinha', 'Fresh lime slices mixed with most traditional drink from Brazil, garnished with additional lime wedges.', 10.00, NULL, true, false, 1, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Caipirinha de maracuja/ Passion fruit caipirinha', 'A refreshing mix of passion fruit juice, lime, sugar, and most traditional drink from Brazil, garnished with starfruit slices and passion fruit seeds.', 10.00, NULL, true, false, 2, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Caipirinha de frutas vermelhas/ Red fruit caipirinha', 'A mix of red fruits with sugar, lime, and most traditional drink from Brazil', 10.00, NULL, true, false, 3, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Caipirinha de manga/ Mango caipirinha', 'Bright yellow mango cocktail with lime, sugar, and most traditional drink from Brazil, garnished with fresh mint leaves.', 10.00, NULL, true, false, 4, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Copacabana', 'White wine, pineapple, and condensed milk.', 11.00, NULL, true, false, 5, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Leblon', 'Red wine mixed with condensed milk', 11.00, NULL, true, false, 6, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Favela', 'Red wine with lime wedges.', 11.00, NULL, true, false, 7, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Sangria', 'Red wine with mixed fruits including oranges, strawberries, and lime slices.', 12.00, NULL, true, false, 8, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Strawberry caipifruit', 'Strawberries blended with condensed milk and the most traditional drink from Brazil', 11.00, NULL, true, false, 9, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Passion fruit caipifruit', 'Passion fruit Caipirinha with condensed milk', 11.00, NULL, true, false, 10, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Lime caipifruit', 'Lime and condensed milk with most traditional drink from Brazil', 11.00, NULL, true, false, 11, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Coconut caipifruit', 'Creamy coconut drink with condensed milk and the most traditional drink from Brazil', 11.00, NULL, true, false, 12, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Corona (beer)', 'Mexican lager with a light, crisp taste and a smooth finish. 12 fl oz bottle.', 9.00, NULL, true, false, 13, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Brahma chopp ( Brazilian beer)', 'Light, refreshing Brazilian lager with a smooth, crisp finish.', 9.00, NULL, true, false, 14, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Modelo ( beer)', 'Golden, mildly flavored Mexican lager with a clean, crisp finish.', 9.00, NULL, true, false, 15, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Bud light (beer)', 'Light beer with a crisp, clean taste and a refreshing finish.', 9.00, NULL, true, false, 16, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Heineken (beer)', 'Premium malt lager with a smooth, balanced taste and a slightly bitter finish.', 9.00, NULL, true, false, 17, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Chandon brut ( sparkling wine) 750ml', 'Crisp sparkling wine with notes of apple, pear, and citrus, featuring a dry finish. 750ml bottle.', 42.00, NULL, true, false, 18, NULL),
  ('cafe1001-0001-4001-8001-00000000000a', 'Korbel brut ( sparkling wine) 750ml', 'A crisp and refreshing sparkling wine with a balanced blend of citrus and apple flavors, perfect for any occasion. 750ml bottle.', 30.00, NULL, true, false, 19, NULL);

-- Smoothies
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-00000000000b', 'Banana - Strawberry Smoothie', 'Blended with fresh strawberries, bananas, and almond milk.', 8.00, NULL, true, false, 1, NULL),
  ('cafe1001-0001-4001-8001-00000000000b', 'Acai-Banana-Strawberry Smoothie', 'Blended with acai, banana, and strawberries.', 8.00, NULL, true, false, 2, NULL),
  ('cafe1001-0001-4001-8001-00000000000b', 'Milk Shake doce de leite', 'Doce de leite ice cream blended with milk, creating a smooth and creamy milkshake with a hint of caramel sweetness.', 10.99, NULL, true, false, 3, NULL),
  ('cafe1001-0001-4001-8001-00000000000b', 'Milkshake de morango', 'Strawberries blended with milk, typically featuring sugar and ice cream for a creamy texture.', 10.99, NULL, true, false, 4, NULL),
  ('cafe1001-0001-4001-8001-00000000000b', 'Milkshake ovomaltine', 'Ovomaltine milkshake: Blended with real vanilla ice cream, milk, and Ovomaltine, a popular malted chocolate powder.', 10.99, NULL, true, false, 5, NULL),
  ('cafe1001-0001-4001-8001-00000000000b', 'Milkshake chocolate', 'Chocolate ice cream and chocolate syrup blended with milk, creating a rich and smooth milkshake experience.', 10.99, NULL, true, false, 6, NULL),
  ('cafe1001-0001-4001-8001-00000000000b', 'Milkshake ninho com nutella', 'Ninho milk powder blended with creamy Nutella and milk, creating a rich and smooth milkshake experience.', 10.99, NULL, true, false, 7, NULL),
  ('cafe1001-0001-4001-8001-00000000000b', 'Milkshake acai com ninho', 'Acai blended with milk and typically accompanied by powdered milk, offering a creamy and smooth texture.', 10.99, NULL, true, false, 8, NULL);

-- Tigela De Açaí (subcategoria no JSON)
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-00000000000c', 'American Style', 'Served with acai berry, guarana syrup, strawberry, banana, granola and honey.', 14.00, NULL, true, false, 1, NULL),
  ('cafe1001-0001-4001-8001-00000000000c', 'Brazilian Style', 'Served with acai berry, guarana syrup, strawberry, banana, granola, condensed milk and powder milk', 15.00, NULL, true, false, 2, 'Rating: 82% (23 reviews)');

-- Desserts — mesma categoria do 016 (…000005). NÃO repetir: Carrot Brigadeiro cake, Coconut cake, Passionfruit mousse.
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-000000000005', 'Bolo no pote de morango com brigadeiro e leite ninho', 'Tres leches with brigadeiro and strawberry cake', 6.00, NULL, true, false, 4, 'Rating: 90% (11 reviews)'),
  ('cafe1001-0001-4001-8001-000000000005', 'Bolo no pote de morango com leite ninho', 'Tres leches with strawberry cake', 6.00, NULL, true, false, 5, 'Rating: 95% (46 reviews)'),
  ('cafe1001-0001-4001-8001-000000000005', 'Brigadeiro Cake(Bolo no pote de brigadeiro)', 'Brigadeiro cake', 6.00, NULL, true, false, 6, 'Rating: 80% (15 reviews)'),
  ('cafe1001-0001-4001-8001-000000000005', 'Romeu e Julieta', 'Cheesecake with guava', 6.00, NULL, true, false, 7, NULL),
  ('cafe1001-0001-4001-8001-000000000005', 'Cural de milho', 'A traditional Brazilian dessert typically made from corn, milk, sugar, and cinnamon.', 6.00, NULL, true, false, 8, NULL);

-- Market (CACAU SHOW) — price_note "+" na trufa coco
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-00000000000d', 'TRUFA COCO CACAU SHOW', 'Rich chocolate truffle filled with a creamy coconut center.', 1.00, NULL, true, false, 1, 'Source price note: +'),
  ('cafe1001-0001-4001-8001-00000000000d', 'CACAU SHOW TABLETE CASTANHA DE CAJU', 'Milk chocolate bar with cashew nuts.', 2.50, NULL, true, false, 2, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'MONTEBELLO MARACUJA', 'Rich chocolate shell filled with a smooth passion fruit cream, offering a delightful contrast of flavors.', 11.50, NULL, true, false, 3, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'MONTEBELLO CHOCOLATE', 'Rich chocolate with a smooth texture and a hint of indulgence, crafted to satisfy your sweet cravings.', 11.50, NULL, true, false, 4, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'MONTEBELLO TRADICIONAL', 'Rich chocolate confection featuring smooth, creamy filling encased in a delicate chocolate shell.', 11.50, NULL, true, false, 5, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'MIAU CHOC. BRANCO / AO LEITE CACAU SHOW', 'A blend of creamy white and milk chocolate in a playful, cat-themed form.', 9.90, NULL, true, false, 6, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'MIAU AO LEITE CACAU SHOW', 'Smooth milk chocolate shaped like cat paws.', 9.90, NULL, true, false, 7, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'MIAU RECHEADO CACAU SHOW', 'Milk chocolate filled with a creamy, rich center.', 9.90, NULL, true, false, 8, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'TRUFA DE CHOCOLATE AO LEITE CACAU SHOW', 'Rich milk chocolate truffle with a smooth, creamy center.', 2.80, NULL, true, false, 9, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'TRUFA CHOCOLATE BRANCO CACAU SHOW', 'Smooth white chocolate truffle with a rich, creamy center.', 2.60, NULL, true, false, 10, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'TRUFA PACOCA CACAU SHOW', 'A rich chocolate truffle filled with paçoca, a traditional Brazilian peanut candy.', 2.50, NULL, true, false, 11, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'TRUFA PETIT GATEAU', 'Rich chocolate truffle with a creamy filling, inspired by the classic French dessert, wrapped in a golden foil.', 3.00, NULL, true, false, 12, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'CX GARRAFINHAS CLASSICAS DRINK CACAU SHOW', 'Filled with rich flavors, these classic drink bottles feature cherry, cognac, and marula chocolates.', 12.99, NULL, true, false, 13, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'BARRA CHOC, PARABENS CACAU SHOW', 'Smooth chocolate bar with "Parabéns" written on it, from Cacau Show.', 7.00, NULL, true, false, 14, NULL),
  ('cafe1001-0001-4001-8001-00000000000d', 'BARRA DE CHOC. EU TE AMO CACAU SHOW', 'Smooth milk chocolate bar with "I love you" message inscribed on the surface.', 9.00, NULL, true, false, 15, NULL);

-- Market Brasil Bistro (texto da categoria no primeiro item — não há coluna descrição em categorias)
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-00000000000e', 'Mr eats coxinha ( chicken croquet)', 'Inside Brasil Bistrô, you''ll find a market with a great selection of authentic, high-quality Brazilian products. Dentro do Brasil Bistrô, você encontra um mercado com uma excelente variedade de produtos brasileiros autênticos e de alta qualidade. — Brazilian croquette filled with shredded chicken and creamy Catupiry cheese. Crispy outside, delicious inside. Coxinha brasileira recheada com frango desfiado , Crocante por fora e deliciosa por dentro.', 9.40, NULL, true, false, 1, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Mr ests coxinha with cheese ( coxinha com catupiry)', 'Brazilian croquette filled with shredded chicken and creamy Catupiry cheese. Crispy outside, delicious inside. Coxinha brasileira recheada com frango desfiado e cremoso Catupiry. Crocante por fora e deliciosa por dentro.', 9.99, NULL, true, false, 2, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Açaí sorbet Petruz organic 500g', 'A burst of Amazonian energy! This smooth and refreshing sorbet is made with real guaraná extract, offering a naturally sweet, fruity flavor and an energizing boost. Perfect as a frozen dessert or smoothie base. Vegan, dairy-free, and delicious. Sorbet de Guaraná Petruz – 500g Uma explosão de energia amazônica! Sorbet cremoso e refrescante feito com extrato natural de guaraná, com sabor doce, frutado e cheio de vitalidade. Ideal como sobremesa gelada ou base para smoothies. Produto vegano, sem lactose e delicioso.', 14.99, NULL, true, false, 3, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Açaí sorbet with banana Petruz 500g organic', 'A burst of Amazonian energy! This smooth and refreshing sorbet is made with real guaraná extract, offering a naturally sweet, fruity flavor and an energizing boost. Perfect as a frozen dessert or smoothie base. Vegan, dairy-free, and delicious. Sorbet de Guaraná Petruz – 500g Uma explosão de energia amazônica! Sorbet cremoso e refrescante feito com extrato natural de guaraná, com sabor doce, frutado e cheio de vitalidade. Ideal como sobremesa gelada ou base para smoothies. Produto vegano, sem lactose e delicioso.', 14.99, NULL, true, false, 4, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Açaí with strawberry Petruz 500g organic', 'A burst of Amazonian energy! This smooth and refreshing sorbet is made with real guaraná extract, offering a naturally sweet, fruity flavor and an energizing boost. Perfect as a frozen dessert or smoothie base. Vegan, dairy-free, and delicious. Uma explosão de energia amazônica! Sorbet cremoso e refrescante feito com extrato natural de guaraná, trazendo um sabor doce, frutado e cheio de energia. Ideal como sobremesa gelada ou base para smoothies. Vegano, sem lactose e delicioso.', 14.99, NULL, true, false, 5, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Piraque recheado limao', 'Crispy sandwich cookies filled with tangy lemon cream.', 2.50, NULL, true, false, 6, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Piraque recheado chocolate', 'Chocolate-filled sandwich cookies with a rich, creamy center encased in crisp chocolate biscuits.', 2.50, NULL, true, false, 7, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Piraque recheado morango', 'Golden sandwich cookies filled with a strawberry-flavored cream.', 2.50, NULL, true, false, 8, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Piraque Presuntinho', 'Crispy, bite-sized crackers with a savory ham flavor.', 3.60, NULL, true, false, 9, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Batata palha sinha', 'Thin, crispy potato sticks, perfect for adding a crunchy texture to your favorite dishes or enjoying as a standalone snack.', 2.99, NULL, true, false, 10, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Nescau 400g', 'A beloved Brazilian chocolate milk powder, typically enjoyed by mixing with milk for a rich, chocolaty drink.', 5.99, NULL, true, false, 11, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Arroz prato fino 1kg', 'Arroz prato fino 1kg', 5.50, NULL, true, false, 12, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Nazinha biscoito polvilho', 'Light, airy biscuits made from cassava starch.', 3.99, NULL, true, false, 13, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Amafil tapioca', 'Amafil tapioca', 3.99, NULL, true, false, 14, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Tapioca terrinha', 'Tapioca terrinha', 4.99, NULL, true, false, 15, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Pimenta malagueta 120g', 'Pimenta malagueta 120g', 5.99, NULL, true, false, 16, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Molho de alho sabor mineiro 120g', 'Molho de alho sabor mineiro 120g', 3.20, NULL, true, false, 17, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Caiçara palmito 550g', 'Caiçara palmito 550g', 11.90, NULL, true, false, 18, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Caiçara palmito 220g', 'Tender hearts of palm, 220g, perfect for salads, appetizers, or adding a unique texture to various dishes.', 6.99, NULL, true, false, 19, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Piraque queijinho', 'Piraque queijinho', 2.50, NULL, true, false, 20, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Kimilho flocao yoki', 'Kimilho flocao yoki', 2.99, NULL, true, false, 21, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Farinha de mandioca torrada Emília 1kg', 'Roasted cassava flour, 1kg package, ideal for various culinary uses.', 4.99, NULL, true, false, 22, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Farinha de mandioca branca Emília 1kg', 'Farinha de mandioca branca Emília 1kg', 4.99, NULL, true, false, 23, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Creme de leite itambe', 'Smooth and creamy milk-based dessert with a hint of sweetness, topped with fresh strawberries and blackberries.', 3.99, NULL, true, false, 24, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Amafil polvilho premium doce', 'Amafil polvilho premium doce 1kg', 7.99, NULL, true, false, 25, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Amafil polvilho premium azedo 1kg', 'Amafil polvilho premium azedo 1kg', 7.99, NULL, true, false, 26, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Feijão Camil preto 1kg', 'Feijão Camil preto 1kg', 6.99, NULL, true, false, 27, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Feijão Camil carioca 1kg', 'Feijão Camil carioca 1kg', 6.99, NULL, true, false, 28, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Pipoca vovozinha 150g', 'Pipoca vovozinha 150g', 3.50, NULL, true, false, 29, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Sal grosso lebre', 'Sal grosso lebre', 2.50, NULL, true, false, 30, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Suco Maguary concentrado caju', 'Suco Maguary concentrado caju', 3.50, NULL, true, false, 31, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Biscoito Bono chocolate', 'Biscoito Bono chocolate', 1.99, NULL, true, false, 32, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Biscoito Bono morango', 'Biscoito Bono morango', 1.99, NULL, true, false, 33, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Piraque goiabinha', 'Piraque goiabinha', 2.69, NULL, true, false, 34, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Piraque leite maltado', 'Piraque leite maltado', 3.20, NULL, true, false, 35, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Mabel cream cracker', 'Mabel cream cracker', 4.50, NULL, true, false, 36, NULL),
  ('cafe1001-0001-4001-8001-00000000000e', 'Mabel biscoito maisena', 'Mabel biscoito maisena', 4.50, NULL, true, false, 37, NULL);

-- Summer Menu
INSERT INTO public.itens_cardapio (
  categoria_id, nome, descricao, preco, imagem_url, disponivel, destaque, ordem, ingredientes_info
) VALUES
  ('cafe1001-0001-4001-8001-00000000000f', 'Build your own plate', 'Build your own plate: Choose your carb, protein, and salad from various options like rice, beans, mashed potatoes, French fries, grilled chicken, and fresh vegetables. Customize to your taste.', 14.00, NULL, true, false, 1, NULL),
  ('cafe1001-0001-4001-8001-00000000000f', 'Protein Shakes', 'Choice of açaí, banana, strawberry, or peanut butter.', 10.00, NULL, true, false, 2, NULL);

COMMIT;
