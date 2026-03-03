export interface Project {
  id: string;
  name: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
  color: string;
  description?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  date: string; // ISO string
  completed: boolean;
}
