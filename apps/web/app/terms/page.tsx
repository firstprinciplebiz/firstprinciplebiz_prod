import Link from "next/link";
import { ArrowLeft, FileText, AlertTriangle, Shield, Users, CreditCard, Scale, UserX } from "lucide-react";

export default function TermsPage() {
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

          {/* Terms Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold text-slate-900">Terms and Conditions</h1>
            </div>
            
            <p className="text-sm text-slate-500 mb-8">Last updated: January 8, 2026</p>

            <div className="prose prose-slate max-w-none space-y-8">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-slate-600">
                  By creating an account or using FirstPrincipleBiz (&quot;the Platform&quot;), you agree to be bound 
                  by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
                </p>
                <p className="text-slate-600 mt-3">
                  These terms apply to all users of the Platform, including students and business owners.
                </p>
              </section>

              {/* Platform Purpose */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-slate-900">2. Platform Purpose</h2>
                </div>
                <p className="text-slate-600">
                  FirstPrincipleBiz is a platform that connects business students with local businesses 
                  seeking assistance with real-world challenges. The Platform serves solely as a 
                  <strong> connection facilitator</strong> between students and businesses.
                </p>
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Important Disclaimer</p>
                      <p className="text-amber-700 text-sm mt-1">
                        FirstPrincipleBiz is <strong>not</strong> an employer, employment agency, or contractor. 
                        We do not employ students or engage them as independent contractors. Any work arrangements 
                        are made directly between students and businesses.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* User Responsibilities */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. User Responsibilities</h2>
                
                <h3 className="text-lg font-medium text-slate-800 mb-2">For Students:</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1 mb-4">
                  <li>Provide accurate information about your skills, education, and experience</li>
                  <li>Communicate professionally with businesses</li>
                  <li>Honor commitments made to businesses</li>
                  <li>Report any inappropriate behavior or concerns</li>
                </ul>

                <h3 className="text-lg font-medium text-slate-800 mb-2">For Businesses:</h3>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Provide accurate descriptions of issues and expectations</li>
                  <li>Communicate clearly about compensation (if any)</li>
                  <li>Treat students with respect and professionalism</li>
                  <li>Honor any agreed-upon compensation or terms</li>
                </ul>
              </section>

              {/* Limitation of Liability */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-slate-900">4. Limitation of Liability</h2>
                </div>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                  <p className="font-medium text-red-800 mb-2">FirstPrincipleBiz is NOT responsible for:</p>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    <li>Any agreements, contracts, or arrangements made between students and businesses</li>
                    <li>Quality, accuracy, or completeness of work delivered by students</li>
                    <li>Payment disputes between students and businesses</li>
                    <li>Scams, fraud, or bad faith actions by any user</li>
                    <li>Financial losses incurred by any party</li>
                    <li>Students not receiving promised compensation from businesses</li>
                    <li>Businesses not receiving expected deliverables from students</li>
                    <li>Any damages, direct or indirect, arising from use of the Platform</li>
                  </ul>
                </div>

                <p className="text-slate-600">
                  Users agree to use the Platform at their own risk. FirstPrincipleBiz provides the Platform 
                  &quot;as is&quot; without warranties of any kind, express or implied.
                </p>
              </section>

              {/* Payment and Compensation */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-slate-900">5. Payment and Compensation</h2>
                </div>
                <p className="text-slate-600 mb-4">
                  Any compensation agreements are made directly between students and businesses. 
                  FirstPrincipleBiz does not process payments, hold funds in escrow, or guarantee payment.
                </p>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Payment terms must be agreed upon directly between parties</li>
                  <li>We recommend documenting all agreements in writing</li>
                  <li>Disputes should be resolved directly between the involved parties</li>
                  <li>Consider using secure payment methods for any financial transactions</li>
                </ul>
              </section>

              {/* Data Collection */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-slate-900">6. Data Collection and Privacy</h2>
                </div>
                <p className="text-slate-600 mb-4">
                  We collect and process personal data as described in our{" "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                  By using the Platform, you consent to our data practices.
                </p>
                <p className="text-slate-600">
                  Data collected includes: name, email, phone (optional), profile information, 
                  messages, and usage data. For full details, please review our Privacy Policy.
                </p>
              </section>

              {/* Account Deletion */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <UserX className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-slate-900">7. Account Deletion</h2>
                </div>
                <p className="text-slate-600 mb-4">
                  You may delete your account at any time through your account settings.
                </p>
                
                <h3 className="text-lg font-medium text-slate-800 mb-2">When you delete your account:</h3>
                
                <p className="font-medium text-slate-700 mt-3">Permanently Deleted:</p>
                <ul className="list-disc list-inside text-slate-600 space-y-1 mb-3">
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Date of birth (students)</li>
                  <li>Business address (businesses)</li>
                  <li>Profile photos</li>
                </ul>

                <p className="font-medium text-slate-700 mt-3">Retained (for platform integrity):</p>
                <ul className="list-disc list-inside text-slate-600 space-y-1 mb-3">
                  <li>Your name (displayed in past messages and interactions)</li>
                  <li>Messages you sent (remain visible to recipients)</li>
                  <li>Files shared in conversations</li>
                  <li>Application or issue history</li>
                </ul>

                <p className="font-medium text-slate-700 mt-3">Automatic Actions:</p>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>For students: All pending applications will be automatically rejected</li>
                  <li>For businesses: All open issues will be automatically closed</li>
                  <li>Chat functionality will be disabled for existing conversations</li>
                </ul>
              </section>

              {/* Prohibited Activities */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Prohibited Activities</h2>
                <p className="text-slate-600 mb-4">Users must not:</p>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>Provide false or misleading information</li>
                  <li>Harass, abuse, or threaten other users</li>
                  <li>Use the Platform for illegal activities</li>
                  <li>Attempt to circumvent the Platform&apos;s security</li>
                  <li>Scrape or collect user data without permission</li>
                  <li>Post spam or unsolicited advertising</li>
                  <li>Impersonate another person or entity</li>
                </ul>
              </section>

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Account Termination</h2>
                <p className="text-slate-600">
                  We reserve the right to suspend or terminate accounts that violate these terms, 
                  engage in fraudulent activity, or for any other reason at our discretion. 
                  Users may also delete their own accounts at any time.
                </p>
              </section>

              {/* Dispute Resolution */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Dispute Resolution</h2>
                <p className="text-slate-600 mb-4">
                  Any disputes arising from use of the Platform shall be resolved through:
                </p>
                <ol className="list-decimal list-inside text-slate-600 space-y-1">
                  <li>Direct communication between the parties involved</li>
                  <li>Informal mediation (if both parties agree)</li>
                  <li>Applicable legal proceedings in the jurisdiction of the Platform&apos;s operation</li>
                </ol>
              </section>

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Changes to Terms</h2>
                <p className="text-slate-600">
                  We may update these Terms and Conditions from time to time. We will notify users of 
                  significant changes via email or through the Platform. Continued use of the Platform 
                  after changes constitutes acceptance of the new terms.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Contact Us</h2>
                <p className="text-slate-600">
                  If you have questions about these Terms and Conditions, please contact us at:{" "}
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









