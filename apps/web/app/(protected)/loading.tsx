import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-100" />
          <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0" />
        </div>
        <p className="text-slate-500 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}


