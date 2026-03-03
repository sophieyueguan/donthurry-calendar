/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isWithinInterval,
  parseISO,
  startOfDay
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  ListTodo, 
  GanttChart, 
  Settings,
  X,
  CheckCircle2,
  Circle,
  Clock,
  LayoutDashboard,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Project, Task } from './types';

// Mock Initial Data
const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: '基因组测序分析',
    startDate: '2026-03-01',
    endDate: '2026-03-15',
    color: '#3B82F6', // Blue
    description: '对样本进行深度测序并分析变异位点。',
    tasks: [
      { id: 't1', projectId: '1', title: '数据清洗', date: '2026-03-02', completed: true },
      { id: 't2', projectId: '1', title: '比对分析', date: '2026-03-05', completed: false },
    ]
  },
  {
    id: '2',
    name: '论文初稿撰写',
    startDate: '2026-03-10',
    endDate: '2026-03-25',
    color: '#10B981', // Green
    description: '完成关于新算法的论文初稿。',
    tasks: [
      { id: 't3', projectId: '2', title: '文献综述', date: '2026-03-12', completed: false },
    ]
  }
];

export default function App() {
  // Load initial data from localStorage or use defaults
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('researcher_planner_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  // Save to localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem('researcher_planner_projects', JSON.stringify(projects));
  }, [projects]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [view, setView] = useState<'calendar' | 'timeline'>('calendar');
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // New/Edit Project Form State
  const [projectForm, setProjectForm] = useState<Partial<Project>>({
    name: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    color: '#3B82F6'
  });

  // Derived Data
  const projectsByDate = useMemo(() => {
    const map: Record<string, Project[]> = {};
    projects.forEach(p => {
      const start = parseISO(p.startDate);
      const end = parseISO(p.endDate);
      const interval = eachDayOfInterval({ start, end });
      interval.forEach(date => {
        const key = format(date, 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(p);
      });
    });
    return map;
  }, [projects]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    projects.forEach(p => {
      p.tasks?.forEach(t => {
        const key = format(parseISO(t.date), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(t);
      });
    });
    return map;
  }, [projects]);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setProjectForm({
      name: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      color: '#3B82F6'
    });
    setIsAddProjectOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      startDate: project.startDate,
      endDate: project.endDate,
      color: project.color
    });
    setIsAddProjectOpen(true);
  };

  const handleSaveProject = () => {
    if (!projectForm.name) return;

    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id ? {
        ...p,
        name: projectForm.name!,
        startDate: projectForm.startDate!,
        endDate: projectForm.endDate!,
        color: projectForm.color!
      } : p));
    } else {
      const project: Project = {
        id: Math.random().toString(36).substr(2, 9),
        name: projectForm.name,
        startDate: projectForm.startDate!,
        endDate: projectForm.endDate!,
        color: projectForm.color!,
        tasks: []
      };
      setProjects([...projects, project]);
    }
    
    setIsAddProjectOpen(false);
    setEditingProject(null);
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const toggleTask = (projectId: string, taskId: string) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks?.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return p;
    }));
  };

  const addTask = (projectId: string, title: string, date: string) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const newTask: Task = {
          id: Math.random().toString(36).substr(2, 9),
          projectId,
          title,
          date,
          completed: false
        };
        return { ...p, tasks: [...(p.tasks || []), newTask] };
      }
      return p;
    }));
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <LayoutDashboard size={24} />
            <h1 className="text-xl font-bold tracking-tight">不着急日历</h1>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">项目管理系统</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-400 px-2 mb-2 uppercase tracking-wider">视图</div>
          <button 
            onClick={() => setView('calendar')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
              view === 'calendar' ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <CalendarIcon size={18} />
            <span className="text-sm font-medium">日历视图</span>
          </button>
          <button 
            onClick={() => setView('timeline')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
              view === 'timeline' ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <GanttChart size={18} />
            <span className="text-sm font-medium">项目甘特图</span>
          </button>

          <div className="pt-6">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">我的项目</div>
              <button 
                onClick={handleOpenAdd}
                className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-full transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {projects.map(project => (
                <div 
                  key={project.id} 
                  onClick={() => handleOpenEdit(project)}
                  className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                    <span className="text-sm text-gray-700 truncate">{project.name}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Settings size={18} />
            <span className="text-sm font-medium">设置</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {format(currentDate, 'yyyy年 MMMM', { locale: zhCN })}
            </h2>
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-3 text-xs font-medium hover:bg-white hover:shadow-sm rounded py-1 transition-all"
              >
                今天
              </button>
              <button 
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>系统正常运行</span>
            </div>
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-auto p-8">
            <AnimatePresence mode="wait">
              {view === 'calendar' ? (
                <motion.div 
                  key="calendar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                >
                  {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => (
                    <div key={day} className="bg-gray-50 p-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {day}
                    </div>
                  ))}
                  {renderCalendarDays(currentDate, projectsByDate, selectedDate, setSelectedDate)}
                </motion.div>
              ) : (
                <motion.div 
                  key="timeline"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  <TimelineView projects={projects} currentDate={currentDate} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Panel: Daily Details */}
          <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-1">
                {selectedDate ? format(selectedDate, 'yyyy年MM月dd日') : '选择日期'}
              </h3>
              <p className="text-xs text-gray-400">{selectedDate ? format(selectedDate, 'EEEE', { locale: zhCN }) : ''}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Projects Active on this day */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={14} className="text-indigo-500" />
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">进行中的项目</h4>
                </div>
                <div className="space-y-3">
                  {selectedDate && projectsByDate[format(selectedDate, 'yyyy-MM-dd')]?.length > 0 ? (
                    projectsByDate[format(selectedDate, 'yyyy-MM-dd')].map(p => (
                      <div key={p.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-sm font-semibold text-gray-700">{p.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-400">截止: {p.endDate}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 italic">今日无活跃项目</p>
                  )}
                </div>
              </div>

              {/* Tasks for this day */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ListTodo size={14} className="text-indigo-500" />
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">今日任务</h4>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedDate && tasksByDate[format(selectedDate, 'yyyy-MM-dd')]?.length > 0 ? (
                    tasksByDate[format(selectedDate, 'yyyy-MM-dd')].map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => toggleTask(t.projectId, t.id)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        {t.completed ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : (
                          <Circle size={18} className="text-gray-300 group-hover:text-indigo-400" />
                        )}
                        <span className={cn(
                          "text-sm transition-all",
                          t.completed ? "text-gray-400 line-through" : "text-gray-700"
                        )}>
                          {t.title}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 italic">今日无具体任务</p>
                  )}
                </div>
                
                {/* Add Task Input */}
                {selectedDate && projects.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <AddTaskForm 
                      projects={projects} 
                      date={format(selectedDate, 'yyyy-MM-dd')} 
                      onAdd={addTask} 
                    />
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Add Project Modal */}
      <AnimatePresence>
        {isAddProjectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddProjectOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">
                  {editingProject ? '编辑科研项目' : '新建科研项目'}
                </h3>
                <button onClick={() => setIsAddProjectOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">项目名称</label>
                  <input 
                    type="text" 
                    value={projectForm.name}
                    onChange={e => setProjectForm({...projectForm, name: e.target.value})}
                    placeholder="例如：深度学习模型优化"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">开始日期</label>
                    <input 
                      type="date" 
                      value={projectForm.startDate}
                      onChange={e => setProjectForm({...projectForm, startDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">结束日期</label>
                    <input 
                      type="date" 
                      value={projectForm.endDate}
                      onChange={e => setProjectForm({...projectForm, endDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">主题颜色</label>
                  <div className="flex gap-2">
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(c => (
                      <button 
                        key={c}
                        onClick={() => setProjectForm({...projectForm, color: c})}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          projectForm.color === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-105"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex gap-3">
                <button 
                  onClick={() => setIsAddProjectOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveProject}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all"
                >
                  {editingProject ? '保存修改' : '创建项目'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderCalendarDays(
  currentDate: Date, 
  projectsByDate: Record<string, Project[]>,
  selectedDate: Date | null,
  setSelectedDate: (d: Date) => void
) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = startDate;

  while (day <= endDate) {
    const d = day;
    const dateKey = format(d, 'yyyy-MM-dd');
    const projectsOnDay = projectsByDate[dateKey] || [];
    const busyLevel = projectsOnDay.length;
    
    // Heatmap colors based on busyLevel
    const heatmapColor = busyLevel === 0 ? 'bg-white' :
                        busyLevel === 1 ? 'bg-indigo-50' :
                        busyLevel === 2 ? 'bg-indigo-100' :
                        busyLevel === 3 ? 'bg-indigo-200' :
                        'bg-indigo-300';

    days.push(
      <div 
        key={d.toString()}
        onClick={() => setSelectedDate(d)}
        className={cn(
          "min-h-[120px] p-2 transition-all cursor-pointer relative group",
          heatmapColor,
          !isSameMonth(d, monthStart) ? "opacity-30" : "opacity-100",
          selectedDate && isSameDay(d, selectedDate) ? "ring-2 ring-inset ring-indigo-500 z-10" : "hover:bg-gray-50/80"
        )}
      >
        <div className="flex justify-between items-start mb-2">
          <span className={cn(
            "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
            isSameDay(d, new Date()) ? "bg-indigo-600 text-white" : "text-gray-500"
          )}>
            {format(d, 'd')}
          </span>
          {busyLevel > 0 && (
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-1.5 rounded">
              {busyLevel} 项目
            </span>
          )}
        </div>
        
        <div className="space-y-1">
          {projectsOnDay.slice(0, 3).map(p => (
            <div 
              key={p.id} 
              className="text-[10px] px-1.5 py-0.5 rounded border border-white/20 text-white truncate shadow-sm"
              style={{ backgroundColor: p.color }}
            >
              {p.name}
            </div>
          ))}
          {projectsOnDay.length > 3 && (
            <div className="text-[9px] text-gray-400 pl-1">还有 {projectsOnDay.length - 3} 个...</div>
          )}
        </div>
      </div>
    );
    day = addDays(day, 1);
  }

  return days;
}

function TimelineView({ projects, currentDate }: { projects: Project[], currentDate: Date }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="overflow-x-auto hide-scrollbar">
      <div className="min-w-max">
        {/* Timeline Header */}
        <div className="flex border-b border-gray-100">
          <div className="w-48 flex-shrink-0 p-4 bg-gray-50 border-r border-gray-100 font-bold text-xs text-gray-400 uppercase tracking-wider sticky left-0 z-20">
            项目名称
          </div>
          {days.map(day => (
            <div key={day.toString()} className={cn(
              "w-12 flex-shrink-0 p-2 text-center border-r border-gray-50",
              isSameDay(day, new Date()) ? "bg-indigo-50" : ""
            )}>
              <div className="text-[10px] text-gray-400">{format(day, 'E', { locale: zhCN })}</div>
              <div className={cn(
                "text-xs font-bold",
                isSameDay(day, new Date()) ? "text-indigo-600" : "text-gray-600"
              )}>{format(day, 'd')}</div>
            </div>
          ))}
        </div>

        {/* Timeline Rows */}
        <div className="divide-y divide-gray-50">
          {projects.map(project => {
            const start = parseISO(project.startDate);
            const end = parseISO(project.endDate);
            
            return (
              <div key={project.id} className="flex group hover:bg-gray-50/50 transition-colors">
                <div className="w-48 flex-shrink-0 p-4 border-r border-gray-100 flex items-center gap-2 sticky left-0 bg-white group-hover:bg-gray-50/50 z-20">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                  <span className="text-sm text-gray-700 font-medium truncate">{project.name}</span>
                </div>
                <div className="flex relative h-14 items-center">
                  {days.map(day => {
                    const isActive = isWithinInterval(startOfDay(day), { 
                      start: startOfDay(start), 
                      end: startOfDay(end) 
                    });
                    const isStart = isSameDay(day, start);
                    const isEnd = isSameDay(day, end);

                    return (
                      <div key={day.toString()} className="w-12 h-full border-r border-gray-50/50 flex items-center justify-center relative">
                        {isActive && (
                          <div 
                            className={cn(
                              "h-6 w-full absolute transition-all",
                              isStart ? "rounded-l-full ml-2" : "",
                              isEnd ? "rounded-r-full mr-2" : "",
                              !isStart && !isEnd ? "w-full" : ""
                            )}
                            style={{ 
                              backgroundColor: project.color,
                              opacity: 0.8,
                              width: isStart && isEnd ? 'calc(100% - 16px)' : (isStart || isEnd ? 'calc(100% - 8px)' : '100%')
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddTaskForm({ projects, date, onAdd }: { projects: Project[], date: string, onAdd: (pid: string, title: string, date: string) => void }) {
  const [title, setTitle] = useState('');
  const [selectedPid, setSelectedPid] = useState(projects[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedPid) return;
    onAdd(selectedPid, title, date);
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-2">
        <select 
          value={selectedPid}
          onChange={e => setSelectedPid(e.target.value)}
          className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="添加新任务..."
            className="flex-1 text-xs bg-white border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button 
            type="submit"
            className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </form>
  );
}
