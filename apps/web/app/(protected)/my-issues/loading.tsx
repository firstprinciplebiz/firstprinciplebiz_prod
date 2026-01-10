import { Card } from "@/components/ui";

export default function MyIssuesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} padding="md" className="text-center">
            <div className="animate-pulse">
              <div className="h-8 w-12 bg-slate-200 rounded mx-auto mb-2" />
              <div className="h-4 w-16 bg-slate-100 rounded mx-auto" />
            </div>
          </Card>
        ))}
      </div>

      {/* Issues skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} padding="lg">
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-6 w-2/3 bg-slate-200 rounded" />
                <div className="h-6 w-24 bg-slate-100 rounded-full" />
              </div>
              <div className="h-4 w-full bg-slate-100 rounded mb-2" />
              <div className="h-4 w-3/4 bg-slate-50 rounded mb-4" />
              <div className="flex gap-4">
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-4 w-20 bg-slate-100 rounded" />
                <div className="h-4 w-28 bg-slate-100 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

