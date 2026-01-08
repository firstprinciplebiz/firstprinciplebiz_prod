import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM2MzY2ZjEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <img 
            src="/icon.png" 
            alt="FirstPrincipleBiz" 
            className="w-10 h-10 rounded-xl object-contain"
          />
          <span className="font-bold text-xl text-slate-900">
            FirstPrinciple<span className="text-primary">Biz</span>
          </span>
        </Link>
      </header>

      {/* Content */}
      <main className="relative z-10 flex items-center justify-center px-4 py-8 min-h-[calc(100vh-100px)]">
        {children}
      </main>
    </div>
  );
}












