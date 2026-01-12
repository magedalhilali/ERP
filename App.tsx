import React, { useEffect, useState } from 'react';
import { fetchAndProcessData, DashboardData, DepartmentStats } from './dataUtils';
import Dashboard from './Dashboard';
import DepartmentDetails from './DepartmentDetails';
import { LayoutDashboard, Loader2, RefreshCcw, Database } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<DepartmentStats | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAndProcessData();
      setData(result);
    } catch (err) {
      setError('Failed to load data from Google Sheets. Please ensure the link is public and valid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* Navigation / Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">ERP Tracker</h1>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                Implementation Dashboard 
                <span className="text-indigo-600 font-semibold">• Part of (MG Tools)</span>
              </p>
            </div>
          </div>
          <button 
            onClick={loadData}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
            Refresh Data
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading && !data && (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500 text-lg">Fetching implementation data...</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!loading && data && (
          <Dashboard 
            data={data} 
            onDepartmentClick={setSelectedDept} 
          />
        )}
      </main>

      {/* Modals */}
      {selectedDept && data && (
        <DepartmentDetails 
          department={selectedDept}
          tasks={data.tasks.filter(t => t.department === selectedDept.name)}
          onClose={() => setSelectedDept(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-400">
            ERP Implementation Tracker &copy; 2026 • Data synced from Google Sheets • Developed by{' '}
            <a 
              href="https://magedalhilali.github.io/Portfolio/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
            >
              Maged Al Hilali
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;