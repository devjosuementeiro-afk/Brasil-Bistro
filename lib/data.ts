export interface Category {
  id: string
  name: string
  emoji: string
  image: string
}

export interface Restaurant {
  id: string
  name: string
  categories: string[]
  image: string
  rating: number
  deliveryTime: string
  deliveryFee: string
  featured?: boolean
}

export interface MenuItem {
  id: string
  restaurantId: string
  name: string
  description: string
  price: number
  image: string
  category: string
  sizes?: { label: string; inches: string; extra: number }[]
  ingredients?: { name: string; image: string }[]
  popular?: boolean
}

export const categories: Category[] = [
  { id: 'all', name: 'Todos', emoji: '🔥', image: '/placeholder.svg?height=60&width=60&query=fire' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', image: '/placeholder.svg?height=80&width=80&query=pizza' },
  { id: 'burger', name: 'Hambúrguer', emoji: '🍔', image: '/placeholder.svg?height=80&width=80&query=burger' },
  { id: 'sushi', name: 'Sushi', emoji: '🍱', image: '/placeholder.svg?height=80&width=80&query=sushi' },
  { id: 'tacos', name: 'Tacos', emoji: '🌮', image: '/placeholder.svg?height=80&width=80&query=tacos' },
  { id: 'salad', name: 'Salada', emoji: '🥗', image: '/placeholder.svg?height=80&width=80&query=salad' },
]

export const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Rose Garden Restaurante',
    categories: ['Hambúrguer', 'Frango', 'Ribs', 'Wings'],
    image: 'https://images.unsplash.com/photo-1540914124281-342587941389?w=600&q=80',
    rating: 4.7,
    deliveryTime: '20 min',
    deliveryFee: 'Grátis',
    featured: true,
  },
  {
    id: '2',
    name: 'Spicy Restaurant',
    categories: ['Hambúrguer', 'Sanduíche', 'Pizza'],
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
    rating: 4.5,
    deliveryTime: '25 min',
    deliveryFee: 'R$ 5',
    featured: true,
  },
  {
    id: '3',
    name: 'Uttora Caffe House',
    categories: ['Pizza', 'Café', 'Bebidas'],
    image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&q=80',
    rating: 4.3,
    deliveryTime: '30 min',
    deliveryFee: 'Grátis',
  },
  {
    id: '4',
    name: 'Caferia Coffee Club',
    categories: ['Café', 'Bolos', 'Sanduíches'],
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    rating: 4.0,
    deliveryTime: '15 min',
    deliveryFee: 'R$ 3',
  },
  {
    id: '5',
    name: 'Pansi Restaurante',
    categories: ['Frango', 'Grelhados', 'Saladas'],
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    rating: 4.6,
    deliveryTime: '35 min',
    deliveryFee: 'R$ 7',
  },
]

export const menuItems: MenuItem[] = [
  {
    id: 'm1',
    restaurantId: '1',
    name: 'Hambúrguer Clássico',
    description: 'Pão brioche, carne angus 180g, queijo cheddar, alface, tomate, cebola caramelizada e molho especial da casa.',
    price: 42,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    category: 'Hambúrguer',
    popular: true,
    sizes: [
      { label: 'P', inches: '180g', extra: 0 },
      { label: 'M', inches: '220g', extra: 8 },
      { label: 'G', inches: '280g', extra: 15 },
    ],
    ingredients: [
      { name: 'Queijo', image: '/placeholder.svg?height=48&width=48&query=cheese' },
      { name: 'Alface', image: '/placeholder.svg?height=48&width=48&query=lettuce' },
      { name: 'Tomate', image: '/placeholder.svg?height=48&width=48&query=tomato' },
      { name: 'Cebola', image: '/placeholder.svg?height=48&width=48&query=onion' },
      { name: 'Molho', image: '/placeholder.svg?height=48&width=48&query=sauce' },
    ],
  },
  {
    id: 'm2',
    restaurantId: '1',
    name: 'Smokin Burger',
    description: 'Pão australiano, carne angus, bacon crocante, queijo gouda, maionese defumada e páprica.',
    price: 52,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80',
    category: 'Hambúrguer',
    popular: true,
    sizes: [
      { label: 'P', inches: '180g', extra: 0 },
      { label: 'M', inches: '220g', extra: 8 },
      { label: 'G', inches: '280g', extra: 15 },
    ],
    ingredients: [
      { name: 'Bacon', image: '/placeholder.svg?height=48&width=48&query=bacon' },
      { name: 'Queijo', image: '/placeholder.svg?height=48&width=48&query=cheese' },
      { name: 'Molho', image: '/placeholder.svg?height=48&width=48&query=sauce' },
      { name: 'Alface', image: '/placeholder.svg?height=48&width=48&query=lettuce' },
    ],
  },
  {
    id: 'm3',
    restaurantId: '1',
    name: 'Buffalo Burger',
    description: 'Hambúrguer apimentado com molho buffalo, frango crocante e jalapeños frescos.',
    price: 48,
    image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80',
    category: 'Hambúrguer',
    sizes: [
      { label: 'P', inches: '180g', extra: 0 },
      { label: 'M', inches: '220g', extra: 8 },
      { label: 'G', inches: '280g', extra: 15 },
    ],
    ingredients: [
      { name: 'Frango', image: '/placeholder.svg?height=48&width=48&query=chicken' },
      { name: 'Molho', image: '/placeholder.svg?height=48&width=48&query=buffalo sauce' },
      { name: 'Jalapeño', image: '/placeholder.svg?height=48&width=48&query=jalapeno' },
    ],
  },
  {
    id: 'm4',
    restaurantId: '1',
    name: 'Frango Grelhado',
    description: 'Peito de frango grelhado temperado, acompanha arroz, feijão e salada da estação.',
    price: 36,
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=600&q=80',
    category: 'Frango',
    sizes: [
      { label: 'P', inches: '200g', extra: 0 },
      { label: 'M', inches: '300g', extra: 10 },
      { label: 'G', inches: '400g', extra: 18 },
    ],
    ingredients: [
      { name: 'Frango', image: '/placeholder.svg?height=48&width=48&query=chicken' },
      { name: 'Arroz', image: '/placeholder.svg?height=48&width=48&query=rice' },
      { name: 'Salada', image: '/placeholder.svg?height=48&width=48&query=salad' },
    ],
  },
  {
    id: 'm5',
    restaurantId: '3',
    name: 'Pizza Calzone Europeu',
    description: 'Prosciutto e funghi — uma variedade de pizza coberta com molho de tomate, mussarela e cogumelos frescos.',
    price: 64,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
    category: 'Pizza',
    popular: true,
    sizes: [
      { label: 'P', inches: '25cm', extra: 0 },
      { label: 'M', inches: '35cm', extra: 14 },
      { label: 'G', inches: '45cm', extra: 22 },
    ],
    ingredients: [
      { name: 'Mussarela', image: '/placeholder.svg?height=48&width=48&query=mozzarella' },
      { name: 'Tomate', image: '/placeholder.svg?height=48&width=48&query=tomato' },
      { name: 'Cogumelos', image: '/placeholder.svg?height=48&width=48&query=mushroom' },
      { name: 'Presunto', image: '/placeholder.svg?height=48&width=48&query=ham' },
      { name: 'Manjericão', image: '/placeholder.svg?height=48&width=48&query=basil' },
    ],
  },
  {
    id: 'm6',
    restaurantId: '3',
    name: 'Pizza Margherita',
    description: 'A clássica pizza italiana com molho de tomate san marzano, mussarela de búfala e folhas de manjericão fresco.',
    price: 52,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
    category: 'Pizza',
    popular: true,
    sizes: [
      { label: 'P', inches: '25cm', extra: 0 },
      { label: 'M', inches: '35cm', extra: 14 },
      { label: 'G', inches: '45cm', extra: 22 },
    ],
    ingredients: [
      { name: 'Mussarela', image: '/placeholder.svg?height=48&width=48&query=mozzarella' },
      { name: 'Tomate', image: '/placeholder.svg?height=48&width=48&query=tomato' },
      { name: 'Manjericão', image: '/placeholder.svg?height=48&width=48&query=basil' },
    ],
  },
  {
    id: 'm7',
    restaurantId: '2',
    name: 'Burger Ferguson',
    description: 'Hambúrguer artesanal com blend especial, queijo prato, picles crocante e molho secreto.',
    price: 40,
    image: 'https://images.unsplash.com/photo-1582196016295-f8c8bd4b3a99?w=600&q=80',
    category: 'Hambúrguer',
    popular: true,
    sizes: [
      { label: 'P', inches: '180g', extra: 0 },
      { label: 'M', inches: '220g', extra: 8 },
      { label: 'G', inches: '280g', extra: 15 },
    ],
    ingredients: [
      { name: 'Queijo', image: '/placeholder.svg?height=48&width=48&query=cheese' },
      { name: 'Picles', image: '/placeholder.svg?height=48&width=48&query=pickles' },
      { name: 'Molho', image: '/placeholder.svg?height=48&width=48&query=sauce' },
    ],
  },
  {
    id: 'm8',
    restaurantId: '2',
    name: 'Rockin Burger',
    description: 'Duplo blend de carne, queijo duplo, bacon e maionese de ervas com pão preto.',
    price: 56,
    image: 'https://images.unsplash.com/photo-1596662951482-0bc7cf393a58?w=600&q=80',
    category: 'Hambúrguer',
    sizes: [
      { label: 'P', inches: '180g', extra: 0 },
      { label: 'M', inches: '220g', extra: 8 },
      { label: 'G', inches: '280g', extra: 15 },
    ],
    ingredients: [
      { name: 'Bacon', image: '/placeholder.svg?height=48&width=48&query=bacon' },
      { name: 'Queijo', image: '/placeholder.svg?height=48&width=48&query=cheese' },
      { name: 'Ervas', image: '/placeholder.svg?height=48&width=48&query=herbs' },
    ],
  },
]

export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find((r) => r.id === id)
}

export function getMenuItemsByRestaurant(restaurantId: string): MenuItem[] {
  return menuItems.filter((item) => item.restaurantId === restaurantId)
}

export function getMenuItemById(id: string): MenuItem | undefined {
  return menuItems.find((item) => item.id === id)
}

export function searchAll(query: string): { restaurants: Restaurant[]; items: MenuItem[] } {
  const q = query.toLowerCase()
  return {
    restaurants: restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.categories.some((c) => c.toLowerCase().includes(q))
    ),
    items: menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    ),
  }
}
