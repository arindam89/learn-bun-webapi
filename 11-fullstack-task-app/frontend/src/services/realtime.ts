/**
 * Real-time communication using Server-Sent Events (SSE)
 * Demonstrates Bun 1.3's built-in SSE capabilities
 */

import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { useNotificationStore } from '@/store/notificationStore';
import toast from 'react-hot-toast';
import type { RealtimeEvent, TaskEvent, CommentEvent, NotificationEvent } from '@/types';

class RealtimeService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Setup connection status monitoring
    this.setupConnectionMonitoring();
  }

  /**
   * Establish SSE connection
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.eventSource?.readyState === EventSource.OPEN) {
      return;
    }

    const { token, user } = useAuthStore.getState();
    if (!token || !user) {
      console.warn('Cannot connect to real-time service: No auth token or user');
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'http://localhost:3001/events'}`;

      // Create EventSource connection
      this.eventSource = new EventSource(wsUrl, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      } as any);

      this.setupEventHandlers();
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      console.log('✅ Connected to real-time service');
      toast.success('Real-time updates enabled');

    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Failed to connect to real-time service:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from SSE
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    console.log('🔌 Disconnected from real-time service');
  }

  /**
   * Setup event handlers for the EventSource
   */
  private setupEventHandlers(): void {
    if (!this.eventSource) return;

    // Connection open
    this.eventSource.onopen = (event) => {
      console.log('🔌 Real-time connection opened');
      this.reconnectAttempts = 0;
    };

    // Connection error
    this.eventSource.onerror = (error) => {
      console.error('❌ Real-time connection error:', error);

      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.scheduleReconnect();
      }
    };

    // Message received
    this.eventSource.onmessage = (event) => {
      try {
        const data: RealtimeEvent = JSON.parse(event.data);
        this.handleRealtimeEvent(data);
      } catch (error) {
        console.error('❌ Failed to parse real-time event:', error);
      }
    };

    // Custom event types
    this.eventSource.addEventListener('task_created', (event) => {
      try {
        const taskEvent: TaskEvent = JSON.parse(event.data);
        this.handleTaskCreated(taskEvent);
      } catch (error) {
        console.error('❌ Failed to parse task_created event:', error);
      }
    });

    this.eventSource.addEventListener('task_updated', (event) => {
      try {
        const taskEvent: TaskEvent = JSON.parse(event.data);
        this.handleTaskUpdated(taskEvent);
      } catch (error) {
        console.error('❌ Failed to parse task_updated event:', error);
      }
    });

    this.eventSource.addEventListener('task_deleted', (event) => {
      try {
        const taskEvent: TaskEvent = JSON.parse(event.data);
        this.handleTaskDeleted(taskEvent);
      } catch (error) {
        console.error('❌ Failed to parse task_deleted event:', error);
      }
    });

    this.eventSource.addEventListener('comment_added', (event) => {
      try {
        const commentEvent: CommentEvent = JSON.parse(event.data);
        this.handleCommentAdded(commentEvent);
      } catch (error) {
        console.error('❌ Failed to parse comment_added event:', error);
      }
    });

    this.eventSource.addEventListener('notification', (event) => {
      try {
        const notificationEvent: NotificationEvent = JSON.parse(event.data);
        this.handleNotification(notificationEvent);
      } catch (error) {
        console.error('❌ Failed to parse notification event:', error);
      }
    });
  }

  /**
   * Handle generic real-time events
   */
  private handleRealtimeEvent(event: RealtimeEvent): void {
    console.log('📡 Real-time event received:', event);

    switch (event.type) {
      case 'connection':
        console.log('🔌 Connection established');
        break;
      case 'user_online':
        console.log('👤 User came online:', event.data);
        break;
      case 'user_offline':
        console.log('👤 User went offline:', event.data);
        break;
      default:
        console.log('📡 Unknown event type:', event.type);
    }
  }

  /**
   * Handle task creation events
   */
  private handleTaskCreated(event: TaskEvent): void {
    const { user } = useAuthStore.getState();
    const { addTask } = useTaskStore.getState();

    // Add task to store if not the current user
    if (event.userId !== user?.id) {
      addTask(event.data);

      // Show notification
      toast.success(`New task created: ${event.data.title}`, {
        icon: '✅',
        duration: 4000,
      });
    }

    // Add to notifications
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      id: event.id,
      type: 'task_created',
      title: 'New Task Created',
      message: `${event.data.title} was created`,
      data: event.data,
      isRead: false,
      createdAt: event.timestamp,
    });
  }

  /**
   * Handle task update events
   */
  private handleTaskUpdated(event: TaskEvent): void {
    const { user } = useAuthStore.getState();
    const { updateTask } = useTaskStore.getState();

    // Update task in store
    updateTask(event.data.id, event.data);

    // Show notification for status changes
    if (event.userId !== user?.id && event.data.status) {
      const statusMessages = {
        todo: 'marked as To Do',
        in_progress: 'started working on',
        review: 'submitted for review',
        completed: 'completed',
      };

      const message = statusMessages[event.data.status as keyof typeof statusMessages];
      if (message) {
        toast(`${event.data.title} ${message}`, {
          icon: '🔄',
          duration: 4000,
        });
      }
    }
  }

  /**
   * Handle task deletion events
   */
  private handleTaskDeleted(event: TaskEvent): void {
    const { removeTask } = useTaskStore.getState();

    // Remove task from store
    removeTask(event.data.id);

    // Show notification
    toast.success(`Task deleted: ${event.data.title}`, {
      icon: '🗑️',
      duration: 4000,
    });
  }

  /**
   * Handle comment events
   */
  private handleCommentAdded(event: CommentEvent): void {
    const { user } = useAuthStore.getState();

    // Show notification if not current user
    if (event.userId !== user?.id) {
      toast.success(`New comment added`, {
        icon: '💬',
        duration: 4000,
      });

      // Add to notifications
      const { addNotification } = useNotificationStore.getState();
      addNotification({
        id: event.id,
        type: 'comment_added',
        title: 'New Comment',
        message: event.data.content.substring(0, 100) + (event.data.content.length > 100 ? '...' : ''),
        data: event.data,
        isRead: false,
        createdAt: event.timestamp,
      });
    }
  }

  /**
   * Handle notification events
   */
  private handleNotification(event: NotificationEvent): void {
    const { addNotification } = useNotificationStore.getState();

    addNotification(event.data);

    // Show toast for important notifications
    const importantTypes = ['deadline_reminder', 'project_updated'];
    if (importantTypes.includes(event.data.type)) {
      toast(event.data.title, {
        icon: '🔔',
        duration: 5000,
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      toast.error('Real-time connection lost. Please refresh the page.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Setup connection monitoring
   */
  private setupConnectionMonitoring(): void {
    // Monitor page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, consider disconnecting to save resources
        if (this.eventSource?.readyState === EventSource.OPEN) {
          console.log('📴 Page hidden, keeping connection alive');
        }
      } else {
        // Page is visible, ensure connection is active
        if (!this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
          console.log('📱 Page visible, reconnecting...');
          this.connect();
        }
      }
    });

    // Monitor network status
    window.addEventListener('online', () => {
      console.log('🌐 Network restored, reconnecting...');
      this.connect();
    });

    window.addEventListener('offline', () => {
      console.log('📵 Network lost');
      toast.error('Connection lost. Some features may not work.');
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.eventSource?.readyState === EventSource.OPEN) return 'connected';
    return 'disconnected';
  }

  /**
   * Check if connection is active
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// Singleton instance
const realtimeService = new RealtimeService();

// Setup function for easy initialization
export function setupSSE(): void {
  realtimeService.connect();
}

// Export service instance and utility functions
export default realtimeService;

export const {
  connect: connectRealtime,
  disconnect: disconnectRealtime,
  getConnectionStatus,
  isConnected,
} = realtimeService;