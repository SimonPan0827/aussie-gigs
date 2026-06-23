function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm sm:rounded-2xl">
      <div className="h-28 animate-pulse bg-gray-200 sm:h-48" />
      <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200 sm:h-4" />
        <div className="h-4 w-full animate-pulse rounded bg-gray-200 sm:h-6" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 sm:h-4" />
        <div className="h-8 w-24 animate-pulse rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-black px-4 pb-8 pt-4 text-white sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="h-4 w-24 animate-pulse rounded bg-white/20" />
          <div className="mt-6 h-10 w-64 animate-pulse rounded bg-white/20 sm:mt-8 sm:h-12" />
          <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded bg-white/15" />
          <div className="mt-8 h-32 animate-pulse rounded-[1.75rem] bg-white/15 sm:mt-10 sm:h-16 sm:rounded-full" />
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-8 w-20 animate-pulse rounded-full bg-white/10"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="h-8 w-44 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-36 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="hidden h-10 w-72 animate-pulse rounded-full bg-gray-200 sm:block" />
        </div>

        <div className="space-y-10">
          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <section key={groupIndex}>
              <div className="mb-4 flex items-center gap-4">
                <div className="h-7 w-56 animate-pulse rounded bg-gray-200" />
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {Array.from({ length: 4 }).map((__, cardIndex) => (
                  <EventCardSkeleton key={cardIndex} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
