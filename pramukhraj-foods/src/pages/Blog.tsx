import { Link } from 'react-router-dom'

const posts = [
  { title: '5 Ways to Serve Papad Beyond the Plate', excerpt: 'From papad chaat to papad churma — recipes to reinvent a pantry staple.', image: 'https://picsum.photos/seed/blog-papad/700/460', slug: 'papad-serving-ideas', date: 'Jul 12, 2026' },
  { title: 'A Guide to Gujarati Pickle Making', excerpt: 'The oils, spices and sun-curing techniques behind a good achaar.', image: 'https://picsum.photos/seed/blog-pickle/700/460', slug: 'gujarati-pickle-guide', date: 'Jun 28, 2026' },
  { title: 'Building the Perfect Festival Gift Box', excerpt: 'What to pack, how to layer flavours, and presentation tips.', image: 'https://picsum.photos/seed/blog-gift/700/460', slug: 'festival-gift-box-guide', date: 'Jun 10, 2026' },
  { title: 'Why Small-Batch Namkeen Tastes Better', excerpt: 'The science (and tradition) behind fresh-fried snacks.', image: 'https://picsum.photos/seed/blog-namkeen/700/460', slug: 'small-batch-namkeen', date: 'May 22, 2026' },
]

export function Blog() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="text-center font-display text-4xl">Stories & Recipes</h1>
      <p className="mt-2 text-center text-sm text-ink-soft">Notes from our kitchens, recipes, and the people behind your food.</p>
      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {posts.map((p) => (
          <Link key={p.slug} to={`/blog/${p.slug}`} className="group">
            <div className="scallop-top aspect-[3/2] overflow-hidden rounded-card bg-tan">
              <img src={p.image} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <p className="mt-3 text-xs text-ink-soft">{p.date}</p>
            <h2 className="mt-1 font-display text-xl group-hover:text-oxblood">{p.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{p.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
