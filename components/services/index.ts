export { ServiceHeader } from './ServiceHeader';
export { ServiceGrid } from './ServiceGrid';
export { ServiceDialogs } from './ServiceDialogs';
export { ServiceCard } from './ServiceCard';
export { ServiceLoading } from './ServiceLoading';

// Types for component props
export interface ServiceHeaderProps {
  selectedType: string;
  serviceTypes: ServiceType[];
  onTypeChange: (type: string) => void;
}

export interface ServiceGridProps {
  services: Service[];
  isAdmin: boolean;
  onRegister: (serviceId: string, message?: string) => Promise<void>;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
}

export interface ServiceDialogsProps {
  editingService: Service | null;
  deletingService: Service | null;
  showForceDeleteDialog: boolean;
  serviceTypes: ServiceType[];
  templeId: string;
  onEditClose: () => void;
  onDeleteClose: () => void;
  onForceDeleteClose: () => void;
  onServiceSaved: () => void;
  onConfirmDelete: (force: boolean) => Promise<void>;
}

// Re-export types from services
import type { Service, ServiceType } from '@/lib/db/services/types';
