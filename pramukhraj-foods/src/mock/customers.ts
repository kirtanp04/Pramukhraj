export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  city: string
  joined: string
  ordersCount: number
  totalSpent: number
  status: 'Active' | 'Blocked'
}

const names = [
  'Aarav Sharma', 'Priya Shah', 'Rohan Mehta', 'Ananya Iyer', 'Karan Patel', 'Divya Nair',
  'Aditya Rao', 'Sneha Joshi', 'Vikram Desai', 'Ishita Gupta', 'Arjun Reddy', 'Meera Pillai',
  'Rahul Kapoor', 'Pooja Bhatt', 'Siddharth Rao', 'Kavya Menon', 'Nikhil Verma', 'Tanvi Shah',
]
const cities = ['Ahmedabad', 'Mumbai', 'Bengaluru', 'Pune', 'Delhi', 'Chennai', 'Hyderabad', 'Surat']

export const customers: Customer[] = names.map((name, i) => ({
  id: `cust-${i + 1}`,
  name,
  email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
  phone: `+91 9${String(800000000 + i * 137219).slice(0, 9)}`,
  avatar: `https://i.pravatar.cc/100?u=customer-${i}`,
  city: cities[i % cities.length],
  joined: new Date(2025, i % 12, (i * 3) % 27 + 1).toISOString(),
  ordersCount: Math.floor(Math.random() * 20) + 1,
  totalSpent: Math.floor(Math.random() * 25000) + 500,
  status: i === 4 ? 'Blocked' : 'Active',
}))
