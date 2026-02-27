import { Card } from "@/components/ui";

export default function IssueDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link skeleton */}
      <div className="h-5 w-28 bg-slate-100 rounded animate-pulse mb-6" />

      {/* Header skeleton */}
      <Card padding="lg" className="mb-6">
        <div className="animate-pulse">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <div className="h-7 w-3/4 bg-slate-200 rounded mb-2" />
              <div className="h-5 w-1/2 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
            <div className="h-6 w-24 bg-slate-100 rounded-full" />
            <div className="h-6 w-16 bg-slate-100 rounded-full" />
          </div>
        </div>
      </Card>

      {/* Description skeleton */}
      <Card padding="lg" className="mb-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-5/6 bg-slate-100 rounded" />
            <div className="h-4 w-4/6 bg-slate-100 rounded" />
          </div>
        </div>
      </Card>

      {/* Skills skeleton */}
      <Card padding="lg" className="mb-6">
        <div className="animate-pulse">
          <div className="h-6 w-36 bg-slate-200 rounded mb-4" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-7 w-24 bg-slate-100 rounded-full" />
            ))}
          </div>
        </div>
      </Card>

      {/* Action button skeleton */}
      <div className="h-12 w-full bg-slate-200 rounded-xl animate-pulse" />
    </div>
  );
}








