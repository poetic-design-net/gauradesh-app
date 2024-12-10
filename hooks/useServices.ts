import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { Service, ServiceType } from '@/lib/db/services/types';
import { getTempleServices, deleteService } from '@/lib/db/services/services';
import { registerForService } from '@/lib/db/services/registrations';
import { getTempleServiceTypes } from '@/lib/db/services/service-types';
import { isTempleAdmin } from '@/lib/db/admin';
import { useToast } from '@/components/ui/use-toast';

interface UseServicesReturn {
  services: Service[];
  serviceTypes: ServiceType[];
  loading: boolean;
  selectedType: string;
  editingService: Service | null;
  deletingService: Service | null;
  showForceDeleteDialog: boolean;
  isAdmin: boolean;
  setServices: Dispatch<SetStateAction<Service[]>>;
  setSelectedType: (type: string) => void;
  handleRegister: (serviceId: string, message?: string) => Promise<void>;
  handleEdit: (service: Service) => void;
  handleDelete: (service: Service) => void;
  confirmDelete: (force: boolean) => Promise<void>;
  handleServiceSaved: () => Promise<void>;
  setEditingService: Dispatch<SetStateAction<Service | null>>;
  setDeletingService: Dispatch<SetStateAction<Service | null>>;
  setShowForceDeleteDialog: Dispatch<SetStateAction<boolean>>;
}

export function useServices(userId: string | null, templeId: string | null): UseServicesReturn {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [showForceDeleteDialog, setShowForceDeleteDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check admin status only after both userId and templeId are available
  useEffect(() => {
    async function checkAdminStatus() {
      if (!userId || !templeId) {
        setIsAdmin(false);
        setIsInitialized(true);
        return;
      }

      try {
        const admin = await isTempleAdmin(userId, templeId);
        setIsAdmin(admin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsInitialized(true);
      }
    }

    checkAdminStatus();
  }, [userId, templeId]);

  // Load service types only after initialization
  useEffect(() => {
    async function loadServiceTypes() {
      if (!templeId || !isInitialized) {
        setServiceTypes([]);
        return;
      }

      try {
        const types = await getTempleServiceTypes(templeId);
        setServiceTypes(types);
      } catch (error) {
        console.error('Error loading service types:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load service types',
        });
      }
    }

    loadServiceTypes();
  }, [templeId, isInitialized, toast]);

  // Update loading state when services are set or when dependencies are not available
  useEffect(() => {
    if (services.length > 0 || !templeId || !isInitialized) {
      setLoading(false);
    }
  }, [services, templeId, isInitialized]);

  const handleRegister = useCallback(async (serviceId: string, message?: string) => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to register for a service',
      });
      return;
    }

    if (!templeId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No temple selected',
      });
      return;
    }

    try {
      await registerForService(userId, serviceId, templeId, message);
      toast({
        title: 'Success',
        description: 'You have successfully registered for this service',
      });
      
      const updatedServices = await getTempleServices(templeId);
      setServices(updatedServices);
    } catch (error: any) {
      console.error('Error registering for service:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to register for service',
      });
    }
  }, [userId, templeId, toast]);

  const handleEdit = useCallback((service: Service) => {
    setEditingService(service);
  }, []);

  const handleDelete = useCallback((service: Service) => {
    setDeletingService(service);
  }, []);

  const confirmDelete = useCallback(async (force: boolean = false) => {
    if (!userId || !deletingService || !templeId) return;

    try {
      await deleteService(deletingService.id, userId, templeId, force);
      toast({
        title: 'Success',
        description: 'Service has been deleted successfully',
      });
      
      const updatedServices = await getTempleServices(templeId);
      setServices(updatedServices);
    } catch (error: any) {
      if (error.code === 'failed-precondition' && !force) {
        setShowForceDeleteDialog(true);
        return;
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete service',
      });
    } finally {
      if (force) {
        setShowForceDeleteDialog(false);
      }
      setDeletingService(null);
    }
  }, [userId, templeId, deletingService, toast]);

  const handleServiceSaved = useCallback(async () => {
    setEditingService(null);
    if (templeId) {
      const updatedServices = await getTempleServices(templeId);
      setServices(updatedServices);
    }
  }, [templeId]);

  const filteredServices = selectedType === 'all'
    ? services
    : services.filter(service => service.type === selectedType);

  return {
    services: filteredServices,
    serviceTypes,
    loading,
    selectedType,
    editingService,
    deletingService,
    showForceDeleteDialog,
    isAdmin,
    setServices,
    setSelectedType,
    handleRegister,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleServiceSaved,
    setEditingService,
    setDeletingService,
    setShowForceDeleteDialog,
  };
}
