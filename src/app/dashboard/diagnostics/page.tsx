'use client';

import { useState, useEffect } from 'react';
import { runAllDiagnostics, DiagnosticResult } from '@/lib/diagnostics';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DiagnosticsPage() {
  const [results, setResults] = useState<Record<string, DiagnosticResult> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const diagnosticResults = await runAllDiagnostics();
      setResults(diagnosticResults);
    } catch (err: any) {
      console.error('Error running diagnostics:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-semibold text-[#342e29]">
            System Diagnostics
          </h1>
          <p className="mt-4 text-lg text-[#51514d]">
            Check the health of your system and connections
          </p>
        </div>

        {/* Diagnostics Results */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600">Running diagnostics...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">{error}</div>
              <button
                onClick={runDiagnostics}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Try Again
              </button>
            </div>
          ) : results ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium">Diagnostic Results</h2>
                <button
                  onClick={runDiagnostics}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Run Again
                </button>
              </div>

              {Object.entries(results).map(([key, result]) => (
                <div key={key} className="mb-8">
                  <div className="flex items-center mb-2">
                    <div
                      className={`w-4 h-4 rounded-full mr-2 ${
                        result.success ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></div>
                    <h3 className="text-lg font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                  </div>
                  <div className="ml-6">
                    <p
                      className={`${
                        result.success ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {result.message}
                    </p>
                    {result.details && (
                      <pre className="mt-2 p-4 bg-gray-50 rounded text-sm overflow-auto max-h-60">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}

              {/* Troubleshooting Tips */}
              {Object.values(results).some(result => !result.success) && (
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Troubleshooting Tips</h3>
                  <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                    <li>Check that your .env.local file exists with the correct Supabase credentials</li>
                    <li>Verify that your Supabase project is running and accessible</li>
                    <li>Ensure that the 'registrations' table exists in your Supabase database</li>
                    <li>Check your network connection and any firewall settings</li>
                    <li>Restart your development server after making changes to environment variables</li>
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
