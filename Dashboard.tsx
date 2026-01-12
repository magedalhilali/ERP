import React from 'react';
import { DepartmentStats, DashboardData } from './dataUtils';
import ProgressBar from './components/ProgressBar';
import { Calendar, CheckSquare, ListTodo, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  data: DashboardData;
  onDepartmentClick: (dept: DepartmentStats) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onDepartmentClick }) => {
  
  // Helper to determine card border/accent color based on department type
  const getDeptColor = (name: string) => {
    if (name.includes('Finance')) return 'border-l-blue-500';
    if (name.includes('HR')) return 'border-l-violet-500';
    if (name.includes('Procurement')) return 'border-l-amber-500';
    if (name.includes('Inventory')) return 'border-l-orange-500';
    if (name.includes('Setup')) return 'border-l-slate-500';
    if (name.includes('Project')) return 'border-l-indigo-500';
    return 'border-l-emerald-500';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Tasks</p>
            <h2 className="text-2xl font-bold text-gray-800">{data.tasks.length}</h2>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Overall Completion</p>
            <h2 className="text-2xl font-bold text-gray-800">{data.overallProgress}%</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
           <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
             <AlertCircle className="w-6 h-6" />
           </div>
           <div>
             <p className="text-sm font-medium text-gray-500">Attention Needed</p>
             <h2 className="text-lg font-bold text-gray-800">
               {data.departmentStats.reduce((acc, curr) => acc + curr.overdueCount, 0)} Overdue
             </h2>
           </div>
        </div>
      </div>

      {/* Main Grid: Department Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-1.5 h-6 bg-indigo-600 rounded mr-3"></span>
            Department Progress
        </h2>
        {/* Changed to max 3 columns for larger cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.departmentStats.map((dept) => (
            <div 
              key={dept.name}
              onClick={() => onDepartmentClick(dept)}
              className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 border-l-4 ${getDeptColor(dept.name)} cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 group`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors pr-2">
                  {dept.name}
                </h3>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="bg-gray-50 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-100">
                    {dept.totalTasks} Tasks
                  </span>
                  {dept.overdueCount > 0 && (
                    <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-100 flex items-center animate-pulse">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {dept.overdueCount} Overdue
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-semibold text-gray-700">{dept.percentage}%</span>
                </div>
                <ProgressBar percentage={dept.percentage} />
              </div>

              <div className="flex items-center justify-between mt-4 text-xs text-gray-500 pt-4 border-t border-gray-50">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {dept.nextDeadline ? (
                    <span>Next: {format(dept.nextDeadline, 'MMM d')}</span>
                  ) : (
                    <span>No upcoming deadlines</span>
                  )}
                </div>
                {/* Footer indicator as backup/redundancy or for design balance */}
                {dept.overdueCount > 0 && (
                  <div className="flex items-center text-rose-600 font-medium">
                     View Details
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-indigo-600 flex items-center font-medium">
                  Open <ArrowRight className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;