import type { Product, Review } from '@/types/catalog'
import { categories } from './categories'
import { brands } from './brands'
import { slugify } from '@/lib/utils'

// Simple deterministic PRNG so the catalog is stable across renders/builds.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(42)
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
const range = (min: number, max: number) => Math.round(min + rand() * (max - min))

const productsByCategory: Record<string, string[]> = {
  papad: ['Udad Papad', 'Masala Papad', 'Jeera Papad', 'Punjabi Papad', 'Rice Papad', 'Moong Papad', 'Chana Papad'],
  khakhra: ['Methi Khakhra', 'Masala Khakhra', 'Plain Khakhra', 'Jeera Khakhra', 'Palak Khakhra', 'Multigrain Khakhra'],
  pickles: ['Raw Mango Pickle', 'Mixed Vegetable Pickle', 'Garlic Pickle', 'Red Chilli Pickle', 'Lemon Pickle', 'Gongura Pickle', 'Amla Pickle'],
  masala: ['Garam Masala', 'Chai Masala', 'Chhole Masala', 'Pav Bhaji Masala', 'Kitchen King Masala', 'Sambhar Masala', 'Chaat Masala'],
  namkeen: ['Ratlami Sev', 'Bhavnagri Gathiya', 'Chivda Mix', 'Aloo Bhujia', 'Dal Moth', 'Navratan Mix', 'Corn Flakes Chivda'],
  snacks: ['Banana Chips', 'Roasted Makhana', 'Masala Peanuts', 'Kurmura Chivda', 'Nachni Chips', 'Tapioca Chips'],
  'dry-fruits': ['California Almonds', 'Kashmiri Walnuts', 'Iranian Pistachios', 'Golden Raisins', 'Cashew Whole', 'Dried Figs', 'Mixed Dry Fruit Box'],
  mukhwas: ['Saunf Mukhwas', 'Sugar Coated Fennel', 'Rainbow Mukhwas', 'Paan Mukhwas', 'Digestive Mix'],
  'instant-mix': ['Khaman Dhokla Mix', 'Handvo Mix', 'Idli Dosa Batter Mix', 'Gulab Jamun Mix', 'Upma Mix', 'Poha Mix'],
  tea: ['Assam CTC Tea', 'Nilgiri Loose Leaf', 'Masala Chai Blend', 'Darjeeling First Flush', 'Lemongrass Green Tea'],
  coffee: ['Filter Coffee Powder', 'Instant Coffee Granules', 'Chicory Blend Coffee', 'Arabica Roast Coffee'],
  sweets: ['Kaju Katli', 'Motichoor Ladoo', 'Soan Papdi', 'Gulab Jamun Tin', 'Rasgulla Tin', 'Mysore Pak', 'Dry Fruit Barfi'],
  'healthy-snacks': ['Baked Sev', 'Roasted Chana', 'Multigrain Namkeen', 'Quinoa Chivda', 'Millet Chips', 'Sprouted Moong Mix'],
  'ready-to-eat': ['Dal Makhani Pouch', 'Rajma Masala Pouch', 'Khichdi Pouch', 'Veg Pulao Pouch', 'Sambhar Pouch'],
  organic: ['Organic Turmeric Powder', 'Organic Jaggery', 'Organic Toor Dal', 'Organic Honey', 'Organic Brown Rice'],
  'festival-specials': ['Diwali Faral Combo', 'Holi Gujiya Pack', 'Rakhi Sweet Box', 'Navratri Sabudana Chivda', 'Ganesh Chaturthi Modak Mix'],
  'gift-packs': ['Premium Namkeen Hamper', 'Dry Fruit Gift Box', 'Sweets Assortment Box', 'Tea & Snacks Combo', 'Festive Celebration Box'],
  beverages: ['Kesar Thandai Mix', 'Aam Panna Squash', 'Rose Sherbet', 'Jaljeera Powder', 'Nimbu Paani Mix'],
}

const weightOptions = ['100g', '200g', '250g', '500g', '1kg']
const originAdjectives = ['Traditional', 'Homestyle', 'Farm Fresh', 'Premium', 'Classic', 'Authentic']
const reviewAuthors = ['Priya Shah', 'Rohan Mehta', 'Ananya Iyer', 'Karan Patel', 'Divya Nair', 'Aditya Rao', 'Sneha Joshi', 'Vikram Desai']
const reviewComments = [
  'Tastes exactly like homemade. Will order again.',
  'Packaging was excellent and delivery was quick.',
  'Good quality but a bit pricier than local stores.',
  'Kids loved it, finished the pack in two days.',
  'Fresh and crisp, exactly as described.',
  'Great for gifting during festivals.',
  'Slightly too spicy for my taste but still good.',
  'Been buying this for years, consistent quality.',
]

function makeReviews(seedOffset: number): Review[] {
  const count = range(2, 5)
  return Array.from({ length: count }, (_, i) => {
    const r = mulberry32(seedOffset + i)
    const rr = () => r()
    return {
      id: `rev-${seedOffset}-${i}`,
      author: reviewAuthors[Math.floor(rr() * reviewAuthors.length)],
      avatar: `https://i.pravatar.cc/100?u=${seedOffset}-${i}`,
      rating: Math.max(3, Math.round(rr() * 2) + 3),
      title: pick(['Great taste', 'Good value', 'Loved it', 'Will buy again', 'As expected']),
      comment: reviewComments[Math.floor(rr() * reviewComments.length)],
      date: new Date(2026, Math.floor(rr() * 6), Math.floor(rr() * 27) + 1).toISOString(),
      verified: rr() > 0.3,
      helpful: Math.floor(rr() * 40),
    }
  })
}

function buildProduct(catSlug: string, name: string, idx: number): Product {
  const category = categories.find((c) => c.slug === catSlug)!
  const brand = pick(brands)
  const mrp = range(60, 850)
  const discountPercent = range(0, 35)
  const price = Math.round(mrp * (1 - discountPercent / 100))
  const weight = pick(weightOptions)
  const seed = catSlug.length * 1000 + idx
  const displayName = `${pick(originAdjectives)} ${name}`
  const slug = slugify(`${displayName}-${weight}-${idx}`)
  const img = (n: number) => `https://picsum.photos/seed/${slug}-${n}/900/900`

  return {
    id: `prod-${slug}`,
    sku: `PRJ-${catSlug.slice(0, 3).toUpperCase()}-${1000 + idx}`,
    name: displayName,
    slug,
    description: `${displayName} — ${weight} pack, made in small batches for the best flavour.`,
    longDescription: `Our ${displayName.toLowerCase()} is prepared using time-tested recipes passed down through generations. Sourced from trusted growers and processed in small, controlled batches, this ${weight} pack retains the aroma and texture that mass-produced alternatives lose. Perfect for daily use or festive spreads.`,
    ingredients: ['Rice flour', 'Refined edible oil', 'Salt', 'Spices', 'Asafoetida'].slice(0, range(3, 5)),
    nutrition: [
      { label: 'Energy', value: `${range(350, 550)} kcal` },
      { label: 'Protein', value: `${range(5, 15)} g` },
      { label: 'Carbohydrates', value: `${range(40, 70)} g` },
      { label: 'Fat', value: `${range(5, 25)} g` },
      { label: 'Sodium', value: `${range(200, 800)} mg` },
    ],
    brand,
    category,
    subcategory: pick(['Classic', 'Spicy', 'Family Pack', 'Value Pack']),
    images: [img(1), img(2), img(3), img(4)],
    thumbnail: img(1),
    price,
    mrp,
    discountPercent,
    stock: range(0, 200),
    weight,
    unit: weight.includes('kg') ? 'kg' : 'g',
    tags: [category.name, brand.name, weight],
    rating: Math.round((3.5 + rand() * 1.5) * 10) / 10,
    reviewCount: range(5, 480),
    ordersCount: range(20, 5000),
    featured: rand() > 0.8,
    trending: rand() > 0.85,
    bestSeller: rand() > 0.82,
    newArrival: rand() > 0.88,
    organic: catSlug === 'organic' || rand() > 0.85,
    vegetarian: true,
    countryOfOrigin: 'India',
    manufacturer: `${brand.name} Foods Pvt. Ltd., Ahmedabad, Gujarat`,
    returnPolicy: '7-day easy return if unopened and unused.',
    shippingTime: pick(['Delivered in 2-3 days', 'Delivered in 3-5 days', 'Delivered in 1-2 days']),
    relatedProductIds: [],
    reviews: makeReviews(seed),
  }
}

export const products: Product[] = Object.entries(productsByCategory).flatMap(([catSlug, names]) =>
  names.flatMap((name, i) => {
    const variantCount = range(1, 2)
    return Array.from({ length: variantCount }, (_, v) => buildProduct(catSlug, name, i * 10 + v))
  }),
)

// Backfill related products within the same category.
const byCategory = new Map<string, Product[]>()
for (const p of products) {
  const list = byCategory.get(p.category.slug) ?? []
  list.push(p)
  byCategory.set(p.category.slug, list)
}
for (const p of products) {
  const siblings = (byCategory.get(p.category.slug) ?? []).filter((s) => s.id !== p.id)
  p.relatedProductIds = siblings.slice(0, 4).map((s) => s.id)
}
