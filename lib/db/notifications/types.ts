export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type?: 'info' | 'warning' | 'error' | 'success';
  link?: string;
}

export interface QuickLink {
  id: string;
  userId: string;
  title: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}
