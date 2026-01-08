import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
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

          {/* Privacy Policy Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
            </div>
            
            <p className="text-sm text-slate-500 mb-8">Last updated: January 8, 2026</p>

            <div className="prose prose-slate max-w-none space-y-8">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
                <p className="text-slate-600">
                  FirstPrincipleBiz (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                  when you use our website (firstprinciple.biz) and mobile application.
                </p>
              </section>

              {/* Information We Collect */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Information We Collect</h2>
                
                <h3 className="text-lg font-medium text-slate-800 mb-2">Personal Information</h3>
                <p className="text-slate-600 mb-4">When you create an account, we collect:</p>
                <ul className="list-disc list-inside text-slate-600 space-y-1 mb-4">
                  <li>Name and email address</li>
                  <li>Phone number (optional)</li>
                  <li>Profile information (bio, skills, interests)</li>
                  <li>Business information (for business users)</li>
                </ul>

                <h3 className="text-lg font-medium text-slate-800 mb-2">Usage Information</h3>
                <p className="text-slate-600">We automatically collect:</p>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Device information and identifiers</li>
                  <li>Log data (IP address, browser type, pages visited)</li>
                  <li>App usage statistics</li>
                </ul>
              </section>

              {/* How We Use Information */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. How We Use Your Information</h2>
                <p className="text-slate-600 mb-4">We use collected information to:</p>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Provide and maintain our services</li>
                  <li>Connect students with businesses</li>
                  <li>Send notifications about issues and messages</li>
                  <li>Improve our platform and user experience</li>
                  <li>Communicate important updates</li>
                </ul>
              </section>

              {/* Data Sharing */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Information Sharing</h2>
                <p className="text-slate-600 mb-4">
                  We do not sell your personal information. We may share information with:
                </p>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li><strong>Other users:</strong> Your profile information is visible to other platform users</li>
                  <li><strong>Service providers:</strong> Third-party services that help us operate (e.g., hosting, analytics)</li>
                  <li><strong>Legal requirements:</strong> When required by law or to protect rights</li>
                </ul>
              </section>

              {/* Data Security */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Data Security</h2>
                <p className="text-slate-600">
                  We implement appropriate security measures to protect your information, including 
                  encryption, secure servers, and access controls. However, no method of transmission 
                  over the Internet is 100% secure.
                </p>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Your Rights</h2>
                <p className="text-slate-600 mb-4">You have the right to:</p>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Access and update your personal information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of promotional communications</li>
                  <li>Request a copy of your data</li>
                </ul>
              </section>

              {/* Account Deletion */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Account Deletion</h2>
                <p className="text-slate-600 mb-4">
                  You may delete your account at any time through your account settings.
                  When you delete your account:
                </p>
                
                <h3 className="text-lg font-medium text-slate-800 mb-2">Permanently Deleted:</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1 mb-4">
                  <li>Your email address</li>
                  <li>Your phone number</li>
                  <li>Your date of birth (students)</li>
                  <li>Your business address (businesses)</li>
                  <li>Your profile photos</li>
                </ul>

                <h3 className="text-lg font-medium text-slate-800 mb-2">Retained for Platform Integrity:</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1 mb-4">
                  <li>Your name (displayed in past messages and interactions)</li>
                  <li>Messages you sent (remain visible to recipients)</li>
                  <li>Files shared in conversations (remain accessible to recipients)</li>
                  <li>Your application or issue history</li>
                </ul>

                <h3 className="text-lg font-medium text-slate-800 mb-2">Automatic Actions:</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1 mb-4">
                  <li><strong>For students:</strong> All pending applications will be automatically rejected</li>
                  <li><strong>For businesses:</strong> All open issues will be automatically closed</li>
                  <li>Chat functionality will be disabled for existing conversations</li>
                </ul>

                <p className="text-slate-600">
                  To delete your account, go to{" "}
                  <Link href="/settings/delete-account" className="text-primary hover:underline">
                    Settings → Delete Account
                  </Link>
                  {" "}while logged in.
                </p>
              </section>

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Children&apos;s Privacy</h2>
                <p className="text-slate-600">
                  Our service is not intended for users under 18 years of age. We do not knowingly 
                  collect information from children under 18.
                </p>
              </section>

              {/* Changes to Policy */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Changes to This Policy</h2>
                <p className="text-slate-600">
                  We may update this Privacy Policy from time to time. We will notify you of any 
                  changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Contact Us</h2>
                <p className="text-slate-600">
                  If you have questions about this Privacy Policy, please contact us at:{" "}
                  <a 
                    href="mailto:firstprinciplebiz@gmail.com" 
                    className="text-primary hover:underline"
                  >
                    firstprinciplebiz@gmail.com
                  </a>
                </p>
              </section>
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
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-slate-900">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


