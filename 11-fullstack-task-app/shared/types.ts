// Shared TypeScript types for TaskFlow application
// These types are used by both frontend and backend

export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'member';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: number;
  userId: number;
  teamId: number;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user?: User;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  teamId: number;
  status: 'active' | 'completed' | 'archived';
  startDate?: string;
  dueDate?: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  team?: Team;
  tasks?: Task[];
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  projectId: number;
  assignedTo?: number;
  createdById: number;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;

  // Relations
  project?: Project;
  assignedUser?: User;
  createdBy?: User;
  comments?: Comment[];
  attachments?: Attachment[];
  dependencies?: Task[];
  dependents?: Task[];
}

export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Attachment {
  id: number;
  taskId: number;
  uploadedById: number;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: string;
  uploadedBy?: User;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'task_assigned' | 'task_completed' | 'comment_added' | 'deadline_reminder' | 'project_updated';
  title: string;
  message: string;
  data?: any; // JSON data for the notification
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

// API Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId: number;
  assignedTo?: number;
  priority?: Task['priority'];
  tags?: string[];
  dueDate?: string;
  estimatedHours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assignedTo?: number;
  status?: Task['status'];
  priority?: Task['priority'];
  tags?: string[];
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  teamId: number;
  startDate?: string;
  dueDate?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: Project['status'];
  startDate?: string;
  dueDate?: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends AuthRequest {
  name: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface LoginResponse extends ApiResponse<AuthResponse> {}

// Query and Filter Types
export interface TaskFilters {
  projectId?: number;
  assignedTo?: number;
  status?: Task['status'];
  priority?: Task['priority'];
  tags?: string[];
  dueDateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectFilters {
  teamId?: number;
  status?: Project['status'];
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface TeamFilters {
  search?: string;
  memberRole?: TeamMember['role'];
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// Real-time Event Types
export interface RealtimeEvent {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'comment_added' | 'user_online' | 'user_offline' | 'notification';
  data: any;
  userId?: number;
  timestamp: string;
}

export interface TaskEvent extends RealtimeEvent {
  type: 'task_created' | 'task_updated' | 'task_deleted';
  data: Task;
  userId: number;
  projectId: number;
}

export interface CommentEvent extends RealtimeEvent {
  type: 'comment_added';
  data: Comment;
  userId: number;
  taskId: number;
}

export interface NotificationEvent extends RealtimeEvent {
  type: 'notification';
  data: Notification;
  userId: number;
}

export interface UserPresenceEvent extends RealtimeEvent {
  type: 'user_online' | 'user_offline';
  data: {
    userId: number;
    name: string;
    avatar?: string;
  };
}

// UI State Types
export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  currentPage: string;
  loading: boolean;
  error?: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  projectId: number;
  assignedTo?: number;
  priority: Task['priority'];
  tags: string[];
  dueDate: string;
  estimatedHours: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
  teamId: number;
  startDate: string;
  dueDate: string;
}

export interface TeamFormData {
  name: string;
  description: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export interface ValidationError extends ApiError {
  field?: string;
  value?: any;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys];

// Chart/Analytics Types
export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  tasksByStatus: Record<Task['status'], number>;
  tasksByPriority: Record<Task['priority'], number>;
  tasksByProject: Array<{ projectId: number; projectName: string; count: number }>;
  averageCompletionTime: number; // in hours
  productivityTrend: Array<{ date: string; completed: number; created: number }>;
}

export interface ProjectAnalytics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  projectsByStatus: Record<Project['status'], number>;
  averageProjectDuration: number; // in days
  teamWorkload: Array<{ teamId: number; teamName: string; activeTasks: number }>;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<User['role'], number>;
  userActivityTrend: Array<{ date: string; activeUsers: number; newUsers: number }>;
  topPerformers: Array<{ userId: number; userName: string; completedTasks: number }>;
}

// Export a type guard for checking API responses
export function isApiResponse<T = any>(obj: any): obj is ApiResponse<T> {
  return obj && typeof obj === 'object' && 'success' in obj;
}

export function isApiError(obj: any): obj is ApiError {
  return obj && typeof obj === 'object' && 'code' in obj && 'message' in obj;
}