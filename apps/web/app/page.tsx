import Link from "next/link";
import {
  Users,
  Building2,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Target,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
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

            <div className="hidden md:flex items-center gap-8">
              <Link href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">
                How it Works
              </Link>
              <Link href="#for-students" className="text-slate-600 hover:text-slate-900 transition-colors">
                For Students
              </Link>
              <Link href="#for-businesses" className="text-slate-600 hover:text-slate-900 transition-colors">
                For Businesses
              </Link>
            </div>

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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Bridging Academia and Real Business
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
              Where Business Students{" "}
              <span className="gradient-text">Solve Real Problems</span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Connect aspiring business minds with local businesses facing real challenges. 
              Students gain experience, businesses get fresh perspectives.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup?role=student" className="btn-primary text-lg px-8 py-4">
                <GraduationCap className="w-5 h-5 mr-2" />
                I&apos;m a Student
              </Link>
              <Link href="/signup?role=business" className="btn-secondary text-lg px-8 py-4">
                <Building2 className="w-5 h-5 mr-2" />
                I&apos;m a Business Owner
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "200+", label: "Active Students" },
              { value: "20+", label: "Local Businesses" },
              { value: "5+", label: "Problems Solved" },
              { value: "100%", label: "Satisfaction Rate" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">How It Works</h2>
            <p className="section-subtitle mx-auto">
              A simple three-step process to connect students with real business challenges
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Building2,
                step: "01",
                title: "Businesses Post Challenges",
                description:
                  "Local businesses describe the problems they're facing - from marketing to finance to operations.",
              },
              {
                icon: Users,
                step: "02",
                title: "Students Express Interest",
                description:
                  "Business students browse challenges, select ones matching their skills, and apply to help.",
              },
              {
                icon: MessageSquare,
                step: "03",
                title: "Collaborate & Solve",
                description:
                  "Matched pairs work together through our platform to analyze and solve the business problem.",
              },
            ].map((item) => (
              <div key={item.step} className="card-hover p-8 relative">
                <div className="absolute top-8 right-8 text-6xl font-bold text-slate-100">
                  {item.step}
                </div>
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-6">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Students */}
      <section id="for-students" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="badge-primary mb-4">For Students</div>
              <h2 className="section-title mb-6">
                Build Your Portfolio with Real Experience
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Stop waiting for that perfect internship. Start solving real problems 
                for real businesses today and build a portfolio that stands out.
              </p>
              
              <div className="space-y-4">
                {[
                  "Work on diverse business challenges across industries",
                  "Apply your academic knowledge to real situations",
                  "Build meaningful connections with business owners",
                  "Choose paid or voluntary opportunities",
                ].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <Link href="/signup?role=student" className="btn-primary mt-8 inline-flex">
                Start as a Student
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 gradient-bg rounded-3xl rotate-3 opacity-20"></div>
              <div className="card p-8 relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-slate-200"></div>
                  <div>
                    <div className="font-semibold text-slate-900">Marketing Challenge</div>
                    <div className="text-sm text-slate-500">Posted by Local Café</div>
                  </div>
                  <div className="ml-auto badge-warning">$200</div>
                </div>
                <p className="text-slate-600 mb-4">
                  Help us understand why our social media engagement dropped 40% 
                  and create a recovery strategy...
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="badge bg-slate-100 text-slate-600">Marketing</span>
                  <span className="badge bg-slate-100 text-slate-600">Social Media</span>
                  <span className="badge bg-slate-100 text-slate-600">Analytics</span>
                </div>
                <Link href="/student/signup" className="btn-primary w-full flex items-center justify-center">
                  <Target className="w-5 h-5 mr-2" />
                  I&apos;m Interested
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Businesses */}
      <section id="for-businesses" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="card p-8">
                <h4 className="font-semibold text-slate-900 mb-4">Post Your Business Challenge</h4>
                <div className="space-y-4">
                  <div>
                    <div className="label">Challenge Title</div>
                    <div className="input bg-slate-50">Need help with inventory management</div>
                  </div>
                  <div>
                    <div className="label">Description</div>
                    <div className="input bg-slate-50 h-24">We&apos;re losing track of stock levels...</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="label">Compensation</div>
                      <div className="input bg-slate-50">Negotiable</div>
                    </div>
                    <div>
                      <div className="label">Duration</div>
                      <div className="input bg-slate-50">2 weeks</div>
                    </div>
                  </div>
                  <Link href="/business/signup" className="btn-primary w-full flex items-center justify-center">Post Challenge</Link>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="badge-success mb-4">For Businesses</div>
              <h2 className="section-title mb-6">
                Get Fresh Perspectives on Your Challenges
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Access talented business students eager to apply their knowledge to your 
                real-world problems. No long-term commitments, just solutions.
              </p>

              <div className="space-y-4">
                {[
                  "Post unlimited business challenges",
                  "Review and select from interested candidates",
                  "Communicate directly through our platform",
                  "Pay only if you offer compensation",
                ].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <Link href="/signup?role=business" className="btn-primary mt-8 inline-flex">
                Start as a Business
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card p-12 gradient-bg text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Bridge the Gap?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join hundreds of students and businesses already collaborating on FirstPrincipleBiz.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="btn bg-white text-primary hover:bg-slate-100 text-lg px-8 py-4"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/icon.png" 
                alt="FirstPrincipleBiz" 
                className="w-8 h-8 rounded-lg object-contain"
              />
              <span className="font-semibold text-slate-900">FirstPrincipleBiz</span>
            </Link>

            <div className="flex items-center gap-8">
              <Link href="/about" className="text-slate-600 hover:text-slate-900">
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
















