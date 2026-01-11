import { Card } from "@/components/ui";

export default function MyApplicationsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-44 bg-slate-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-64 bg-slate-100 rounded animate-pulse" />
      </div>

      {/* Applications skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} padding="lg">
            <div className="animate-pulse flex gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-48 bg-slate-200 rounded" />
                  <div className="h-5 w-20 bg-slate-100 rounded-full" />
                </div>
                <div className="h-4 w-32 bg-slate-100 rounded mb-2" />
                <div className="h-4 w-40 bg-slate-50 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


