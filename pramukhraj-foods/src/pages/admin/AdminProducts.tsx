import { useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { products as initialProducts, categories, brands } from '@/mock'
import type { Product } from '@/types/catalog'
import { formatINR, slugify } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/admin/DataTable'
import { AdminDrawer } from '@/components/admin/AdminDrawer'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAuthStore } from '@/store/authStore'

const productSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  categorySlug: z.string().min(1, 'Select a category'),
  brandSlug: z.string().min(1, 'Select a brand'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  mrp: z.coerce.number().positive('MRP must be greater than 0'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  weight: z.string().min(1, 'Weight is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
})
type ProductFormValues = z.infer<typeof productSchema>

export function AdminProducts() {
  const [items, setItems] = useState<Product[]>(initialProducts)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const logAction = useAuthStore((s) => s.logAction)
  const canManage = useAuthStore((s) => s.hasPermission('products.manage'))

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
  })

  function openCreate() {
    setEditing(null)
    reset({ name: '', categorySlug: categories[0].slug, brandSlug: brands[0].slug, price: 0, mrp: 0, stock: 0, weight: '200g', description: '' })
    setDrawerOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    reset({
      name: p.name, categorySlug: p.category.slug, brandSlug: p.brand.slug,
      price: p.price, mrp: p.mrp, stock: p.stock, weight: p.weight, description: p.description,
    })
    setDrawerOpen(true)
  }

  function onSubmit(values: ProductFormValues) {
    const category = categories.find((c) => c.slug === values.categorySlug)!
    const brand = brands.find((b) => b.slug === values.brandSlug)!
    const discountPercent = values.mrp > values.price ? Math.round(((values.mrp - values.price) / values.mrp) * 100) : 0

    if (editing) {
      setItems((prev) => prev.map((p) => p.id === editing.id ? {
        ...p, name: values.name, category, brand, price: values.price, mrp: values.mrp,
        discountPercent, stock: values.stock, weight: values.weight, description: values.description,
      } : p))
      logAction('Updated product', values.name)
    } else {
      const slug = slugify(`${values.name}-${Date.now()}`)
      const img = `https://picsum.photos/seed/${slug}/900/900`
      const newProduct: Product = {
        id: `prod-${slug}`, sku: `PRJ-NEW-${Math.floor(Math.random() * 9000 + 1000)}`, name: values.name, slug,
        description: values.description, longDescription: values.description,
        ingredients: [], nutrition: [], brand, category, subcategory: 'Classic',
        images: [img, img, img, img], thumbnail: img,
        price: values.price, mrp: values.mrp, discountPercent, stock: values.stock,
        weight: values.weight, unit: values.weight.includes('kg') ? 'kg' : 'g', tags: [category.name, brand.name],
        rating: 4.2, reviewCount: 0, ordersCount: 0, featured: false, trending: false, bestSeller: false,
        newArrival: true, organic: false, vegetarian: true, countryOfOrigin: 'India',
        manufacturer: `${brand.name} Foods Pvt. Ltd.`, returnPolicy: '7-day easy return if unopened.',
        shippingTime: 'Delivered in 3-5 days', relatedProductIds: [], reviews: [],
      }
      setItems((prev) => [newProduct, ...prev])
      logAction('Created product', values.name)
    }
    setDrawerOpen(false)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    setItems((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    logAction('Deleted product', deleteTarget.name)
    setDeleteTarget(null)
  }

  const columns = useMemo<ColumnDef<Product, any>[]>(() => [
    {
      header: 'Product', accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <div>
            <p className="line-clamp-1 font-medium">{row.original.name}</p>
            <p className="font-mono text-xs text-ink-soft">{row.original.sku}</p>
          </div>
        </div>
      ),
    },
    { header: 'Category', accessorFn: (r) => r.category.name },
    { header: 'Price', accessorKey: 'price', cell: ({ row }) => <span className="font-mono">{formatINR(row.original.price)}</span> },
    {
      header: 'Stock', accessorKey: 'stock',
      cell: ({ row }) => {
        const s = row.original.stock
        return <Badge variant={s === 0 ? 'oxblood' : s < 15 ? 'turmeric' : 'teal'}>{s === 0 ? 'Out of stock' : `${s} units`}</Badge>
      },
    },
    { header: 'Rating', accessorKey: 'rating', cell: ({ row }) => `${row.original.rating.toFixed(1)} ★` },
    {
      header: '', id: 'actions', enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <a href={`/product/${row.original.slug}`} target="_blank" rel="noreferrer" className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5" aria-label="View on storefront">
            <Eye size={14} />
          </a>
          {canManage && (
            <>
              <button onClick={() => openEdit(row.original)} className="rounded-full p-1.5 text-ink-soft hover:bg-ink/5" aria-label="Edit"><Pencil size={14} /></button>
              <button onClick={() => setDeleteTarget(row.original)} className="rounded-full p-1.5 text-oxblood hover:bg-oxblood/5" aria-label="Delete"><Trash2 size={14} /></button>
            </>
          )}
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canManage])

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Products</h1>
          <p className="text-sm text-ink-soft">{items.length} products across {categories.length} categories</p>
        </div>
        {canManage && <Button onClick={openCreate}><Plus size={15} /> Add Product</Button>}
      </div>

      <DataTable columns={columns} data={items} searchPlaceholder="Search products by name or SKU..." pageSize={8} />

      <AdminDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editing ? 'Edit Product' : 'Add New Product'}
        description={editing ? `Editing ${editing.sku}` : 'Create a new product listing'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Product Name" error={errors.name?.message}>
            <input {...register('name')} className="admin-input" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category" error={errors.categorySlug?.message}>
              <select {...register('categorySlug')} className="admin-input">
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Brand" error={errors.brandSlug?.message}>
              <select {...register('brandSlug')} className="admin-input">
                {brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Price (₹)" error={errors.price?.message}>
              <input type="number" step="1" {...register('price')} className="admin-input" />
            </FormField>
            <FormField label="MRP (₹)" error={errors.mrp?.message}>
              <input type="number" step="1" {...register('mrp')} className="admin-input" />
            </FormField>
            <FormField label="Stock" error={errors.stock?.message}>
              <input type="number" {...register('stock')} className="admin-input" />
            </FormField>
          </div>
          <FormField label="Weight / Pack Size" error={errors.weight?.message}>
            <input {...register('weight')} placeholder="e.g. 200g" className="admin-input" />
          </FormField>
          <FormField label="Description" error={errors.description?.message}>
            <textarea {...register('description')} rows={4} className="admin-input resize-none" />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Create Product'}</Button>
          </div>
        </form>
      </AdminDrawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this product?"
        description={`"${deleteTarget?.name}" will be permanently removed from the catalog. This cannot be undone.`}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-soft">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-oxblood">{error}</span>}
    </label>
  )
}
