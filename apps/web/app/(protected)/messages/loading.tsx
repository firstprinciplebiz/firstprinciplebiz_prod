import { Card } from "@/components/ui";

export default function MessagesLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
      </div>

      {/* Conversations skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} padding="md">
            <div className="animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-5 w-40 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-64 bg-slate-100 rounded" />
              </div>
              <div className="h-4 w-12 bg-slate-100 rounded" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

