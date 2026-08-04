export default function StoreLoading() {
  return (
    <main className="container animate-pulse py-6" aria-label="Loading page">
      <div className="h-8 w-48 rounded-full bg-primary/10" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-primary/5 bg-white">
            <div className="aspect-[4/5] bg-primary/10" />
            <div className="space-y-3 p-4">
              <div className="h-4 rounded bg-primary/10" />
              <div className="h-4 w-1/2 rounded bg-gold/15" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
