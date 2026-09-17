import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FolderKanban, 
  Calendar, 
  ArrowRight, 
  ShieldAlert, 
  BarChart2, 
  Search,
  Filter,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../context/FirestoreContext';
import { useNavigate } from 'react-router-dom';

export const TeamWorkloadPage: React.FC = () => {
  const navigate = useNavigate();
  const { teamRoster, allUsers } = useAuth();
  const { tasks, projects, setActiveProjectId } = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Build combined roster
  const members = teamRoster.length > 0 ? teamRoster : allUsers.map(u => ({
    id: u.id,
    displayName: u.displayName,
    email: u.email,
    role: u.role,
    department: u.department || 'Operations',
    organization: u.organization || 'Milous Project Alliance',
    isActive: true
  }));

  // Calculate task allocation per team member
  const memberWorkloads = members.map((member) => {
    const assignedTasks = tasks.filter(
      (t) => t.assigneeId === member.id || t.assigneeName?.toLowerCase() === member.displayName?.toLowerCase()
    );

    const activeTasks = assignedTasks.filter((t) => t.status !== 'COMPLETED');
    const completedTasks = assignedTasks.filter((t) => t.status === 'COMPLETED');
    const highPriorityCount = activeTasks.filter((t) => t.priority === 'HIGH' || t.priority === 'URGENT').length;
    
    // Assume each active task represents ~8 hours of weekly effort
    const estimatedHours = activeTasks.length * 8;
    const weeklyCapacityHours = 40;
    const utilizationPct = Math.min(150, Math.round((estimatedHours / weeklyCapacityHours) * 100));

    let status: 'OPTIMAL' | 'LIGHT' | 'NEAR_CAPACITY' | 'OVERLOADED' = 'OPTIMAL';
    if (utilizationPct > 100) status = 'OVERLOADED';
    else if (utilizationPct >= 80) status = 'NEAR_CAPACITY';
    else if (utilizationPct < 40) status = 'LIGHT';

    return {
      ...member,
      assignedTasks,
      activeTasks,
      completedTasks,
      highPriorityCount,
      estimatedHours,
      weeklyCapacityHours,
      utilizationPct,
      status
    };
  });

  // Filter members
  const filteredMembers = memberWorkloads.filter((m) => {
    const matchesSearch = !searchTerm || 
      m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = departmentFilter === 'ALL' || m.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const totalAssignedTasks = tasks.filter(t => t.assigneeId || t.assigneeName).length;
  const unassignedTasks = tasks.filter(t => !t.assigneeId && !t.assigneeName);
  const avgUtilization = Math.round(
    memberWorkloads.reduce((acc, curr) => acc + curr.utilizationPct, 0) / (memberWorkloads.length || 1)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Team Workload &amp; Capacity
            </h1>
            <p className="text-xs text-slate-500">
              Real-time resource allocation, active task bandwidth, and capacity planning across team roles
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <FolderKanban className="w-4 h-4 text-emerald-400" />
            <span>Manage Tasks Board</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Team Load</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-2xl font-black ${avgUtilization > 90 ? 'text-amber-600' : 'text-slate-900'}`}>
              {avgUtilization}%
            </span>
            <span className="text-xs font-semibold text-slate-500">capacity</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full ${avgUtilization > 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, avgUtilization)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Assigned Tasks</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalAssignedTasks}</span>
            <span className="text-xs font-semibold text-slate-500">tasks</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Distributed across roster</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unassigned Tasks</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-2xl font-black ${unassignedTasks.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {unassignedTasks.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">pending</span>
          </div>
          <p className="text-[10px] text-amber-600 font-medium mt-1">Ready for assignment</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Active Staff</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{members.length}</span>
            <span className="text-xs font-semibold text-slate-500">members</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Available for project work</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search member, role, or unit..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="Executive Management">Executive Management</option>
            <option value="Field Operations Unit">Field Operations Unit</option>
            <option value="Monitoring & Evaluation">Monitoring &amp; Evaluation</option>
            <option value="Finance & Grants Compliance">Finance &amp; Grants</option>
          </select>
        </div>
      </div>

      {/* Team Member Workload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.map((member) => {
          let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          if (member.status === 'OVERLOADED') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
          else if (member.status === 'NEAR_CAPACITY') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
          else if (member.status === 'LIGHT') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

          return (
            <div key={member.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition">
              
              {/* Member Card Top */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {member.displayName?.slice(0, 2).toUpperCase() || 'TM'}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">{member.displayName}</h2>
                    <p className="text-[11px] text-slate-500">{member.email}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-mono px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 uppercase font-semibold">
                      {member.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${badgeColor}`}>
                  {member.status.replace('_', ' ')}
                </span>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-1.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 text-[11px]">Assigned Effort / Capacity</span>
                  <span className="font-black text-slate-900 text-xs">
                    {member.estimatedHours} hrs / {member.weeklyCapacityHours} hrs ({member.utilizationPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      member.utilizationPct > 100 
                        ? 'bg-rose-500' 
                        : member.utilizationPct >= 80 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, member.utilizationPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{member.activeTasks.length} In-Progress Tasks</span>
                  <span>{member.completedTasks.length} Finished</span>
                </div>
              </div>

              {/* Assigned Tasks List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Active Work Tasks ({member.activeTasks.length})</span>
                </div>

                {member.activeTasks.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs">
                    <UserCheck className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                    <span>No active tasks assigned. Available for new assignments.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {member.activeTasks.map((t) => (
                      <div 
                        key={t.id}
                        className="p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 truncate text-[11px]">{t.title}</p>
                          <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Due: {t.plannedEndDate || 'No deadline'}</span>
                          </p>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md shrink-0 uppercase ${
                          t.priority === 'HIGH' || t.priority === 'URGENT' 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
