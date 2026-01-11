import { Card } from "@/components/ui";

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="h-8 w-28 bg-slate-200 rounded-lg animate-pulse mb-6" />

      {/* Settings cards skeleton */}
      <Card padding="lg">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-slate-200 rounded" />
                  <div className="h-5 w-32 bg-slate-100 rounded" />
                </div>
                <div className="w-4 h-4 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}


