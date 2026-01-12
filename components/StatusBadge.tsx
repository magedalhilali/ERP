import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  isOverdue?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isOverdue }) => {
  if (status === 'Done') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Done
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Overdue
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
      <Clock className="w-3 h-3 mr-1" />
      {status}
    </span>
  );
};

export default StatusBadge;