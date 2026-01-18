import { Card } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with avatar skeleton */}
      <Card padding="lg" className="mb-6">
        <div className="animate-pulse flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-28 h-28 bg-slate-200 rounded-full flex-shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <div className="h-7 w-48 bg-slate-200 rounded mb-3 mx-auto sm:mx-0" />
            <div className="h-4 w-64 bg-slate-100 rounded mb-2 mx-auto sm:mx-0" />
            <div className="h-4 w-40 bg-slate-100 rounded mx-auto sm:mx-0" />
          </div>
        </div>
      </Card>

      {/* Bio skeleton */}
      <Card padding="lg" className="mb-6">
        <div className="animate-pulse">
          <div className="h-6 w-24 bg-slate-200 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-5/6 bg-slate-100 rounded" />
            <div className="h-4 w-4/6 bg-slate-100 rounded" />
          </div>
        </div>
      </Card>

      {/* Skills skeleton */}
      <Card padding="lg" className="mb-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-7 w-20 bg-slate-100 rounded-full" />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}








