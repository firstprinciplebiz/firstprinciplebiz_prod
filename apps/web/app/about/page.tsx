import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/icon.png" 
                alt="FirstPrincipleBiz" 
                className="w-10 h-10 rounded-xl object-contain"
              />
              <span className="font-bold text-xl text-slate-900">
                FirstPrinciple<span className="text-primary">Biz</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* About Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-6">About Us</h1>
            
            <div className="prose prose-slate max-w-none">
              <p className="text-lg text-slate-600 mb-8">
                FirstPrincipleBiz is a non-profit initiative dedicated to bridging the gap between 
                business education and real-world experience. We connect aspiring business students 
                with local businesses facing genuine challenges, creating a win-win ecosystem where 
                students gain practical experience and businesses receive fresh, innovative perspectives.
              </p>

              <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Our Vision</h2>
              <p className="text-slate-600 mb-8">
                To create a world where every business student has access to real-world experience 
                before graduation, and every small business has access to talented minds eager to help 
                solve their challenges. We believe in learning by doing and growing together.
              </p>

              {/* Founder Section */}
              <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-6">Founder</h2>
              <div className="flex flex-col md:flex-row items-start gap-6 bg-slate-50 rounded-xl p-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                  HB
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Himanshu Bobade</h3>
                  <p className="text-slate-600 mb-4">
                    Founder of FirstPrincipleBiz, Himanshu started this initiative with a simple belief: 
                    practical experience should not be a luxury reserved for those with connections. 
                    By creating this platform, he aims to democratize access to real business experience 
                    for students everywhere.
                  </p>
                </div>
              </div>

              {/* Contact */}
              <h2 className="text-2xl font-semibold text-slate-900 mt-10 mb-4">Get in Touch</h2>
              <a 
                href="mailto:firstprinciplebiz@gmail.com" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
              >
                <Mail className="w-5 h-5" />
                firstprinciplebiz@gmail.com
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/icon.png" 
                alt="FirstPrincipleBiz" 
                className="w-8 h-8 rounded-lg object-contain"
              />
              <span className="font-semibold text-slate-900">FirstPrincipleBiz</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

