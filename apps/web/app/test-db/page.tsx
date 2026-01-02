import { createClient } from "@/lib/supabase/server";

export default async function TestDBPage() {
  const supabase = await createClient();
  
  // Test 1: Check if we can connect to Supabase
  let connectionStatus = "❌ Failed";
  let errorMessage = "";
  let tables: string[] = [];
  
  try {
    // Try to query the users table (even if empty, it should work)
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .limit(1);
    
    if (error) {
      errorMessage = error.message;
    } else {
      connectionStatus = "✅ Connected";
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Unknown error";
  }

  // Test 2: Check all tables exist
  const tableNames = [
    "users",
    "student_profiles", 
    "business_profiles",
    "issues",
    "issue_interests",
    "messages",
    "notifications"
  ];

  for (const table of tableNames) {
    try {
      const { error } = await supabase.from(table).select("id").limit(0);
      if (!error) {
        tables.push(`✅ ${table}`);
      } else {
        tables.push(`❌ ${table}: ${error.message}`);
      }
    } catch {
      tables.push(`❌ ${table}: Query failed`);
    }
  }

  // Test 3: Check auth service
  let authStatus = "❌ Failed";
  try {
    const { data: { user } } = await supabase.auth.getUser();
    authStatus = user ? `✅ Logged in as ${user.email}` : "✅ Auth working (no user logged in)";
  } catch {
    authStatus = "❌ Auth service error";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          🔌 Supabase Connection Test
        </h1>

        {/* Connection Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Connection</h2>
          <p className="text-2xl">{connectionStatus}</p>
          {errorMessage && (
            <p className="text-red-600 mt-2 text-sm font-mono bg-red-50 p-3 rounded">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Auth Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Service</h2>
          <p className="text-lg">{authStatus}</p>
        </div>

        {/* Tables Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
          <h2 className="text-xl font-semibold mb-4">Database Tables</h2>
          <ul className="space-y-2">
            {tables.map((table, i) => (
              <li key={i} className="font-mono text-sm">{table}</li>
            ))}
          </ul>
        </div>

        {/* Environment Check */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <ul className="space-y-2 font-mono text-sm">
            <li>
              NEXT_PUBLIC_SUPABASE_URL:{" "}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}
            </li>
            <li>
              NEXT_PUBLIC_SUPABASE_ANON_KEY:{" "}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}
            </li>
            <li>
              SUPABASE_SERVICE_ROLE_KEY:{" "}
              {process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing"}
            </li>
          </ul>
        </div>

        <p className="text-slate-500 text-sm mt-6">
          Visit this page at: <code className="bg-slate-100 px-2 py-1 rounded">/test-db</code>
        </p>
      </div>
    </div>
  );
}










