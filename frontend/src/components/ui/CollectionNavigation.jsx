// A visible navigation affordance appears only on collections with neighbours.
// Static content keeps its quiet presentation; counters remain live regions.
export default function CollectionNavigation({ children, className = '', ...props }) {
  return <nav {...props} className={`collection-navigation ${className}`}>
    <p className="basis-full text-12 font-semibold opacity-80">Colección · Anterior / Siguiente</p>
    {children}
  </nav>;
}
