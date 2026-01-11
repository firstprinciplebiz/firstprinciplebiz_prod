import { Card } from "@/components/ui";

export default function IssuesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-40 bg-slate-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar skeleton */}
        <div className="lg:w-72 flex-shrink-0">
          <Card padding="lg">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-20 bg-slate-200 rounded" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg" />
                ))}
              </div>
              <div className="h-5 w-16 bg-slate-200 rounded mt-4" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-6 w-16 bg-slate-100 rounded-full" />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Issues list skeleton */}
        <div className="flex-1 space-y-4">
          <div className="h-12 bg-slate-100 rounded-xl animate-pulse mb-6" />
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} padding="lg">
              <div className="animate-pulse flex gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-1/2 bg-slate-100 rounded" />
                  <div className="h-12 bg-slate-50 rounded" />
                  <div className="flex gap-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-6 w-16 bg-slate-100 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


