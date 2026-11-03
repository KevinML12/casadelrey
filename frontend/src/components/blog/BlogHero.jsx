// A quiet masthead inside the selected message's photographic scene.
export default function BlogHero({ categories = [], activeCategory, onCategoryChange }) {
  return <header className="flex flex-wrap items-end justify-between gap-5 text-white">
    <h1 className="text-24 font-semibold tracking-tight leading-tight">Blog</h1>
    {categories.length > 1 && <div className="w-full min-w-0 sm:w-auto sm:max-w-xs">
      <label htmlFor="blog-category" className="mb-2 block text-13 font-semibold text-white/85">Categoría</label>
      <select id="blog-category" value={activeCategory || ''} onChange={event => onCategoryChange(event.target.value || null)} className="block min-h-11 w-full max-w-full rounded-[12px] border border-white/35 bg-bg px-4 py-2 text-14 text-white focus-ring">
        <option value="">Todas</option>
        {categories.map(category => <option key={category} value={category}>{category}</option>)}
      </select>
    </div>}
  </header>;
}
