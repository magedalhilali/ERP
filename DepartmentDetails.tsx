import React, { useState, useMemo } from 'react';
import { X, Search, Calendar, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Task, DepartmentStats } from './dataUtils';
import StatusBadge from './components/StatusBadge';
import { format, compareAsc, isBefore, startOfToday } from 'date-fns';

interface DepartmentDetailsProps {
  department: DepartmentStats;
  tasks: Task[];
  onClose: () => void;
}

type SortKey = 'description' | 'date' | 'status';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'done' | 'pending';

const DepartmentDetails: React.FC<DepartmentDetailsProps> = ({ department, tasks, onClose }) => {
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'asc' });

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const processedTasks = useMemo(() => {
    // 1. Filter
    let result = tasks.filter(task => {
      const matchesSearch = task.description.toLowerCase().includes(filter.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'done') matchesStatus = task.status === 'Done';
      if (statusFilter === 'pending') matchesStatus = task.status !== 'Done';
      
      return matchesSearch && matchesStatus;
    });

    // 2. Sort
    result.sort((a, b) => {
      const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;

      switch (sortConfig.key) {
        case 'date':
          if (!a.parsedDate && !b.parsedDate) return 0;
          if (!a.parsedDate) return 1; // Null dates last
          if (!b.parsedDate) return -1;
          return compareAsc(a.parsedDate, b.parsedDate) * directionMultiplier;
        
        case 'description':
          return a.description.localeCompare(b.description) * directionMultiplier;
        
        case 'status':
          return a.status.localeCompare(b.status) * directionMultiplier;
          
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, filter, statusFilter, sortConfig]);

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-300 opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-indigo-600" /> 
      : <ArrowDown className="w-3 h-3 ml-1 text-indigo-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h3 className="text-xl leading-6 font-semibold text-gray-900" id="modal-title">
                {department.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {department.completedTasks} / {department.totalTasks} tasks completed
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Controls - Background changed to white */}
          <div className="px-4 py-3 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-gray-100">
            <div className="relative w-full sm:w-1/2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                placeholder="Search tasks..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                className="block w-full sm:w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-900 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">All Statuses</option>
                <option value="done">Completed Only</option>
                <option value="pending">Pending Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th 
                    scope="col" 
                    className="bg-white px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors group select-none"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center">
                      Task Description
                      {renderSortIcon('description')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="bg-white px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider w-40 cursor-pointer hover:bg-gray-50 transition-colors group select-none"
                    onClick={() => handleSort('date')}
                  >
                     <div className="flex items-center">
                      EDD / Date
                      {renderSortIcon('date')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="bg-white px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider w-36 cursor-pointer hover:bg-gray-50 transition-colors group select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {renderSortIcon('status')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedTasks.map((task) => {
                  const isOverdue = task.status !== 'Done' && task.parsedDate && isBefore(task.parsedDate, startOfToday());
                  
                  return (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {task.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className={`flex items-center ${isOverdue ? 'text-rose-600 font-bold' : 'text-gray-500'}`}>
                          <Calendar className={`w-4 h-4 mr-2 ${isOverdue ? 'text-rose-500' : 'text-gray-400'}`} />
                          {task.parsedDate ? format(task.parsedDate, 'MMM d, yyyy') : (task.date || '-')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={task.status} isOverdue={isOverdue} />
                      </td>
                    </tr>
                  );
                })}
                {processedTasks.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 text-sm">
                      No tasks found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer Stats */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
             <span>Showing {processedTasks.length} tasks</span>
             {department.overdueCount > 0 && (
               <span className="flex items-center text-rose-600 font-medium">
                 <AlertTriangle className="w-3 h-3 mr-1" />
                 {department.overdueCount} Overdue
               </span>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetails;