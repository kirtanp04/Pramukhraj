import { Link } from 'react-router-dom'

const posts = [
  { title: '5 Ways to Serve Papad Beyond the Plate', excerpt: 'From papad chaat to papad churma — recipes to reinvent a pantry staple.', image: 'https://picsum.photos/seed/blog-papad/600/400', slug: 'papad-serving-ideas' },
  { title: 'A Guide to Gujarati Pickle Making', excerpt: 'The oils, spices and sun-curing techniques behind a good achaar.', image: 'https://picsum.photos/seed/blog-pickle/600/400', slug: 'gujarati-pickle-guide' },
  { title: 'Building the Perfect Festival Gift Box', excerpt: 'What to pack, how to layer flavours, and presentation tips.', image: 'https://picsum.photos/seed/blog-gift/600/400', slug: 'festival-gift-box-guide' },
]

export function BlogPreview() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-oxblood">From the journal</p>
          <h2 className="font-display text-3xl">Stories & Recipes</h2>
        </div>
        <Link to="/blog" className="hidden text-sm font-medium text-oxblood hover:underline sm:block">Read the blog</Link>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="group">
            <div className="scallop-top aspect-[3/2] overflow-hidden rounded-card bg-tan">
              <img src={p.image} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <h3 className="mt-3 font-display text-lg group-hover:text-oxblood">{p.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{p.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
