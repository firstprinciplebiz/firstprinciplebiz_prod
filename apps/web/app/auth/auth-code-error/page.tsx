import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Authentication Error
        </h1>
        
        <p className="text-slate-600 mb-8">
          There was a problem signing you in. This could happen if the link expired 
          or was already used. Please try signing in again.
        </p>

        <div className="space-y-4">
          <Link href="/login" className="btn-primary w-full">
            Try Again
          </Link>
          <Link href="/" className="btn-secondary w-full">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
















