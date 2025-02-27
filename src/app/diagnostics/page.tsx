'use client';

import { useState, useEffect } from 'react';
import { runDiagnostics } from '@/utils/diagnostics';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DiagnosticsPage() {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runTests = async () => {
      try {
        setIsLoading(true);
        const diagnosticResults = await runDiagnostics();
        setResults(diagnosticResults);
      } catch (err: any) {
        setError(err.message || 'An error occurred during diagnostics');
        console.error('Diagnostics error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    runTests();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <LoadingSpinner size="lg" text="Running diagnostics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-[#fdfbf7]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Diagnostics Error</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-[#fdfbf7]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#342e29] mb-6">System Diagnostics</h1>
        
        {/* Environment Variables */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Environment Variables</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <table className="w-full">
              <tbody>
                {results?.environment && Object.entries(results.environment).map(([key, value]: [string, any]) => (
                  <tr key={key} className="border-b last:border-b-0">
                    <td className="py-2 font-medium">{key}</td>
                    <td className={`py-2 ${value === 'Missing' ? 'text-red-600' : 'text-green-600'}`}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Supabase Connection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Supabase Connection</h2>
          <div className="bg-white rounded-lg shadow p-4">
            {results?.supabaseConnection && (
              <div>
                <div className={`text-lg font-medium ${results.supabaseConnection.success ? 'text-green-600' : 'text-red-600'}`}>
                  {results.supabaseConnection.success ? 'Connection Successful' : 'Connection Failed'}
                </div>
                {results.supabaseConnection.error && (
                  <div className="mt-2 p-3 bg-red-50 text-red-700 rounded">
                    Error: {results.supabaseConnection.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Authentication */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Authentication</h2>
          <div className="bg-white rounded-lg shadow p-4">
            {results?.authentication && (
              <div>
                <div className={`text-lg font-medium ${results.authentication.success ? 'text-green-600' : 'text-red-600'}`}>
                  {results.authentication.success ? 'Authentication Working' : 'Authentication Issues'}
                </div>
                <div className="mt-1">
                  Session: {results.authentication.hasSession ? 'Active' : 'None'}
                </div>
                {results.authentication.error && (
                  <div className="mt-2 p-3 bg-red-50 text-red-700 rounded">
                    Error: {results.authentication.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Table Access */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Database Tables Access</h2>
          <div className="bg-white rounded-lg shadow p-4">
            {results?.tableAccess && Object.entries(results.tableAccess).map(([table, info]: [string, any]) => (
              <div key={table} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-b-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{table}</span>
                  <span className={`px-2 py-1 rounded text-sm ${info.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {info.success ? 'Accessible' : 'Error'}
                  </span>
                </div>
                {info.count !== undefined && (
                  <div className="mt-1 text-sm text-gray-600">
                    Count: {info.count}
                  </div>
                )}
                {info.error && (
                  <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                    {info.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Raw Results */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Raw Diagnostic Data</h2>
          <div className="bg-white rounded-lg shadow p-4 overflow-auto">
            <pre className="text-xs">{JSON.stringify(results, null, 2)}</pre>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Run Again
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
