import Papa from 'papaparse';
import { startOfMonth, format, parse, isValid, isPast, isFuture, compareAsc, isBefore, startOfToday } from 'date-fns';

export interface Task {
  id: string;
  description: string;
  status: 'Done' | 'Pending' | 'In Progress';
  date: string; // ISO string or original string if parsing fails
  parsedDate: Date | null;
  department: DepartmentType;
  raw: any;
}

export type DepartmentType = 
  | 'HR & Payroll'
  | 'Finance'
  | 'Procurement'
  | 'Inventory & Stores'
  | 'Equipment & Workshop'
  | 'Projects & Sales'
  | 'Setup & Admin'
  | 'General';

export interface DepartmentStats {
  name: DepartmentType;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  nextDeadline: Date | null;
  overdueCount: number;
}

export interface DashboardData {
  tasks: Task[];
  departmentStats: DepartmentStats[];
  overallProgress: number;
}

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1NJAWsl2n0i-rbZR0vpSUiFdOEYOV-JAQZyMy3MsjVKA/export?format=csv';

const KEYWORDS: Record<string, string[]> = {
  'HR & Payroll': ['employee', 'payroll', 'leave', 'salary', 'wps', 'recruit', 'candidate', 'personnel', 'hr'],
  'Finance': ['finance', 'account', 'payment', 'voucher', 'ledger', 'asset', 'bank', 'tax', 'p&l', 'balance', 'audit'],
  'Procurement': ['purchase', 'supplier', 'lpo', 'quotation', 'procurement', 'vendor'],
  'Inventory & Stores': ['stock', 'inventory', 'material', 'store', 'warehouse', 'item'],
  'Equipment & Workshop': ['equipment', 'workshop', 'vehicle', 'service', 'maintenance', 'repair', 'machinery'],
  'Projects & Sales': ['project', 'boq', 'job', 'costing', 'estimate', 'tender', 'sales', 'crm', 'contract'],
  'Setup & Admin': ['srs', 'database', 'master', 'installation', 'setup', 'admin', 'user', 'role', 'configuration', 'meeting', 'kickoff']
};

const determineDepartment = (desc: string): DepartmentType => {
  const lowerDesc = desc.toLowerCase();
  for (const [dept, words] of Object.entries(KEYWORDS)) {
    if (words.some(word => lowerDesc.includes(word))) {
      return dept as DepartmentType;
    }
  }
  return 'General';
};

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleanStr = dateStr.trim();
  if (!cleanStr) return null;

  // Extensive list of formats to try
  const formats = [
    'd-MMM-yy', 'dd-MMM-yy', 'd-MMM-yyyy', 'dd-MMM-yyyy', // Google Sheet Default exports (e.g. 15-Jan-24)
    'dd/MM/yyyy', 'd/M/yyyy', 'MM/dd/yyyy', 'M/d/yyyy', // Slash formats
    'yyyy-MM-dd', // ISO
    'd MMM yyyy', 'd MMMM yyyy', // Space separated
    'MMM d, yyyy' // US standard
  ];
  
  for (const fmt of formats) {
    const parsed = parse(cleanStr, fmt, new Date());
    if (isValid(parsed)) return parsed;
  }
  
  // Fallback for JS date parsing (handles some ISO and local variations)
  const jsDate = new Date(cleanStr);
  if (isValid(jsDate)) return jsDate;

  return null;
};

// Normalize string for fuzzy matching (remove spaces, special chars, lowercase)
const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

const findColumnKey = (headers: string[], candidates: string[]): string | undefined => {
  if (!headers || headers.length === 0) return undefined;

  // 1. Normalized Match (Aggressive)
  const normalizedHeaders = headers.map(h => ({ original: h, norm: normalize(h) }));
  
  for (const candidate of candidates) {
    const normCandidate = normalize(candidate);
    const match = normalizedHeaders.find(h => h.norm === normCandidate || h.norm.includes(normCandidate));
    if (match) return match.original;
  }
  
  return undefined;
};

export const fetchAndProcessData = async (): Promise<DashboardData> => {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error('Failed to fetch data');
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
        complete: (results) => {
          if (results.data.length === 0) {
            resolve({ tasks: [], departmentStats: [], overallProgress: 0 });
            return;
          }

          const headers = results.meta.fields || Object.keys(results.data[0] as object);

          const descKey = findColumnKey(headers, ['Work Breakdown Structure Task Description', 'Task Description', 'Description', 'Task']) || headers[0];
          const statusKey = findColumnKey(headers, ['Current Status', 'Status']) || 'Status';
          
          // Column X is index 23 (A=0 ... X=23)
          const colXHeader = headers.length > 23 ? headers[23] : undefined;

          // Strategy: Prefer strict "EDD at Site" or explicit Column X if available, otherwise fuzzy match
          let dateKey = colXHeader && normalize(colXHeader).includes('edd') 
            ? colXHeader 
            : findColumnKey(headers, ['EDD at Site', 'EDD', 'Target Date', 'Deadline', 'Date']);
            
          // If we still didn't find a key but we have Column X, default to it as requested
          if (!dateKey && colXHeader) {
            dateKey = colXHeader;
          }

          const tasks: Task[] = results.data.map((row: any, index) => {
            const description = row[descKey] || 'Untitled Task';
            const statusRaw = row[statusKey] || 'Pending';
            
            // Primary: Try the detected key
            // Secondary: Try accessing Column X directly by index if available (in case row keys are mismatched)
            const rowValues = Object.values(row);
            let dateRaw = row[dateKey as string] || '';
            
            if (!dateRaw && rowValues.length > 23) {
              dateRaw = rowValues[23] as string;
            }
            
            const isDone = statusRaw.toLowerCase().includes('done') || statusRaw.toLowerCase().includes('completed');
            const status = isDone ? 'Done' : 'Pending'; 
            const parsedDate = parseDate(dateRaw);

            return {
              id: `task-${index}`,
              description,
              status,
              date: dateRaw, 
              parsedDate,
              department: determineDepartment(description),
              raw: row
            };
          });

          // Compute Stats per Department
          const deptMap = new Map<DepartmentType, Task[]>();
          const allDepts: DepartmentType[] = Object.keys(KEYWORDS) as DepartmentType[];
          allDepts.push('General');

          allDepts.forEach(d => deptMap.set(d, []));
          tasks.forEach(t => {
            const current = deptMap.get(t.department) || [];
            deptMap.set(t.department, [...current, t]);
          });

          const departmentStats: DepartmentStats[] = [];
          
          deptMap.forEach((deptTasks, name) => {
            if (deptTasks.length === 0 && name === 'General') return; 

            const total = deptTasks.length;
            const completed = deptTasks.filter(t => t.status === 'Done').length;
            const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
            
            // Next deadline: Earliest future date
            const futureTasks = deptTasks
              .filter(t => t.status !== 'Done' && t.parsedDate && isFuture(t.parsedDate))
              .sort((a, b) => compareAsc(a.parsedDate!, b.parsedDate!));
            
            // Overdue: Not Done AND Date is strictly before today (start of today)
            const overdue = deptTasks.filter(t => 
              t.status !== 'Done' && 
              t.parsedDate && 
              isBefore(t.parsedDate, startOfToday())
            ).length;

            departmentStats.push({
              name,
              totalTasks: total,
              completedTasks: completed,
              percentage,
              nextDeadline: futureTasks[0]?.parsedDate || null,
              overdueCount: overdue
            });
          });

          const totalAll = tasks.length;
          const completedAll = tasks.filter(t => t.status === 'Done').length;

          resolve({
            tasks,
            departmentStats: departmentStats.filter(d => d.totalTasks > 0), 
            overallProgress: totalAll === 0 ? 0 : Math.round((completedAll / totalAll) * 100)
          });
        },
        error: (err) => reject(err)
      });
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};