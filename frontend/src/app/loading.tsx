export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-black px-6 py-5 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-white/20" />
          <div className="h-10 w-56 animate-pulse rounded-full bg-white/10" />
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-5 w-72 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <div className="h-48 animate-pulse bg-gray-200" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-6 w-4/5 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
                <div className="h-10 w-32 animate-pulse rounded-full bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
