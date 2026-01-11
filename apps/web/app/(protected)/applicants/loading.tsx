import { Card } from "@/components/ui";

export default function ApplicantsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link skeleton */}
      <div className="h-5 w-36 bg-slate-100 rounded animate-pulse mb-6" />

      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="text-right">
          <div className="h-8 w-12 bg-slate-200 rounded animate-pulse mb-1 ml-auto" />
          <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>

      {/* Applicants skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} padding="lg">
            <div className="animate-pulse flex gap-4">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="h-5 w-40 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-64 bg-slate-100 rounded mb-3" />
                <div className="h-8 w-48 bg-slate-100 rounded-lg mb-3" />
                <div className="flex gap-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-6 w-16 bg-slate-100 rounded-full" />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-9 w-24 bg-slate-200 rounded-lg" />
                <div className="h-9 w-24 bg-slate-100 rounded-lg" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


