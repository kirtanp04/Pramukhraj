import { useParams, Link } from 'react-router-dom'

const posts: Record<string, { title: string; image: string; date: string; body: string[] }> = {
  'papad-serving-ideas': {
    title: '5 Ways to Serve Papad Beyond the Plate',
    image: 'https://picsum.photos/seed/blog-papad/1200/700',
    date: 'Jul 12, 2026',
    body: [
      'Papad is often treated as a side, but it deserves more credit. Crushed over a bowl of curd rice, it adds crunch and a hit of spice. Layered into a chaat with tamarind chutney and onions, it becomes a starter worth planning a meal around.',
      'Try roasting it lightly and crumbling it over avocado toast for an unexpected fusion breakfast, or use it as a base for canapés at your next gathering.',
    ],
  },
  'gujarati-pickle-guide': {
    title: 'A Guide to Gujarati Pickle Making',
    image: 'https://picsum.photos/seed/blog-pickle/1200/700',
    date: 'Jun 28, 2026',
    body: [
      'Good achaar starts with the right oil — cold-pressed mustard or sesame oil, never refined. The vegetables are sun-dried just enough to remove excess moisture before being layered with a hand-ground spice mix.',
      'Patience matters most: a pickle needs at least a week of curing in sunlight before the flavours settle into balance.',
    ],
  },
  'festival-gift-box-guide': {
    title: 'Building the Perfect Festival Gift Box',
    image: 'https://picsum.photos/seed/blog-gift/1200/700',
    date: 'Jun 10, 2026',
    body: [
      'A great gift box balances textures and flavours — something crunchy, something sweet, something spiced. We recommend pairing khakhra with a tin of kaju katli and a small jar of mixed pickle.',
      'Presentation matters as much as content: layer tissue paper by colour, and always include a handwritten note.',
    ],
  },
  'small-batch-namkeen': {
    title: 'Why Small-Batch Namkeen Tastes Better',
    image: 'https://picsum.photos/seed/blog-namkeen/1200/700',
    date: 'May 22, 2026',
    body: [
      'Large-batch frying changes oil temperature unevenly, leading to inconsistent texture. Small kitchens fry in smaller quantities, keeping oil temperature stable and the final product crisp rather than greasy.',
      "It's slower, and it costs more — but the difference is obvious in the first bite.",
    ],
  },
}

export function BlogPost() {
  const { slug } = useParams()
  const post = slug ? posts[slug] : null

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="font-display text-2xl">Post not found</p>
        <Link to="/blog" className="mt-4 inline-block text-sm text-oxblood hover:underline">Back to blog</Link>
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 md:px-6">
      <Link to="/blog" className="text-xs text-ink-soft hover:text-oxblood">← Back to blog</Link>
      <p className="mt-4 text-xs text-ink-soft">{post.date}</p>
      <h1 className="mt-1 font-display text-3xl sm:text-4xl">{post.title}</h1>
      <div className="scallop-top mt-6 aspect-[16/9] overflow-hidden rounded-card bg-tan">
        <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
      </div>
      <div className="mt-8 space-y-5 text-sm leading-relaxed text-ink-soft">
        {post.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </article>
  )
}
