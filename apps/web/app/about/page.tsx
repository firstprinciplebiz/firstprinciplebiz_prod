import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">About FirstPrincipleBiz</h1>
        <p className="text-slate-700 mb-4">
          FirstPrincipleBiz connects business students with real-world business problems from
          founders and business owners. Students get hands-on experience while businesses gain
          fresh, structured thinking on their toughest challenges.
        </p>
        <p className="text-slate-700 mb-4">
          Our mission is to bridge academia and industry by giving students meaningful, portfolio‑worthy
          work and giving businesses access to motivated talent that can help them move faster.
        </p>
        <p className="text-slate-700 mb-4">
          If you have questions, feedback, or would like to partner with us, you can reach us at{" "}
          <a
            href="mailto:contact@firstprinciple.biz"
            className="text-primary hover:underline font-medium"
          >
            contact@firstprinciple.biz
          </a>
          .
        </p>

        <div className="mt-8">
          <Link href="/" className="text-primary hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}


