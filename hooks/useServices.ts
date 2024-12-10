import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { Service, ServiceType } from '@/lib/db/services/types';
import { getTempleServices, deleteService } from '@/lib/db/services/services';
import { registerForService, deleteRegistration } from '@/lib/db/services/registrations';
import { getTempleServiceTypes } from '@/lib/db/services/service-types';
import { isTempleAdmin } from '@/lib/db/admin';
import { useToast } from '@/components/ui/use-toast';
import { subscribeToTempleServices, subscribeToServicesByType } from '@/lib/db/services/services-optimized';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseServicesReturn {
  services: Service[];
  serviceTypes: ServiceType[];
  loading: boolean;
  selectedType: string;
  editingService: Service | null;
  deletingService: Service | null;
  showForceDeleteDialog: boolean;
  isAdmin: boolean;
  userRegistrations: Record<string, { status: 'pending' | 'approved' | 'rejected' }>;
  setServices: Dispatch<SetStateAction<Service[]>>;
  setSelectedType: (type: string) => void;
  handleRegister: (serviceId: string, message?: string) => Promise<void>;
  handleUnregister: (serviceId: string) => Promise<void>;
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
  const [userRegistrations, setUserRegistrations] = useState<Record<string, { status: 'pending' | 'approved' | 'rejected' }>>({});

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

    setLoading(true);
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

  // Subscribe to services based on selected type
  useEffect(() => {
    if (!templeId || !isInitialized) return;

    let unsubscribe: () => void;

    if (selectedType === 'all') {
      unsubscribe = subscribeToTempleServices(
        templeId,
        (updatedServices) => {
          setServices(updatedServices);
          setLoading(false);
        },
        {
          orderByField: 'date',
          orderDirection: 'desc'
        }
      );
    } else {
      unsubscribe = subscribeToServicesByType(
        templeId,
        selectedType,
        (updatedServices) => {
          setServices(updatedServices);
          setLoading(false);
        }
      );
    }

    return () => unsubscribe();
  }, [templeId, isInitialized, selectedType]);

  // Subscribe to user registrations
  useEffect(() => {
    if (!userId || !templeId) {
      setUserRegistrations({});
      return;
    }

    // Update path to use temple-specific collection
    const registrationsRef = collection(db, `temples/${templeId}/service_registrations`);
    const q = query(registrationsRef, where('userId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const registrations: Record<string, { status: 'pending' | 'approved' | 'rejected' }> = {};
        snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          registrations[data.serviceId] = { status: data.status };
        });
        setUserRegistrations(registrations);
      },
      (error) => {
        console.error('Error subscribing to registrations:', error);
        setUserRegistrations({});
      }
    );

    return () => unsubscribe();
  }, [userId, templeId]);

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
    } catch (error: any) {
      console.error('Error registering for service:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to register for service',
      });
    }
  }, [userId, templeId, toast]);

  const handleUnregister = useCallback(async (serviceId: string) => {
    if (!userId || !templeId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to unregister from a service',
      });
      return;
    }

    try {
      // Find the registration ID from the temple-specific collection
      const registrationsRef = collection(db, `temples/${templeId}/service_registrations`);
      const q = query(
        registrationsRef,
        where('userId', '==', userId),
        where('serviceId', '==', serviceId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Registration not found');
      }

      const registrationId = snapshot.docs[0].id;
      await deleteRegistration(registrationId, userId, templeId);
      
      toast({
        title: 'Success',
        description: 'You have successfully unregistered from this service',
      });
    } catch (error: any) {
      console.error('Error unregistering from service:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to unregister from service',
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
  }, []);

  return {
    services,
    serviceTypes,
    loading,
    selectedType,
    editingService,
    deletingService,
    showForceDeleteDialog,
    isAdmin,
    userRegistrations,
    setServices,
    setSelectedType,
    handleRegister,
    handleUnregister,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleServiceSaved,
    setEditingService,
    setDeletingService,
    setShowForceDeleteDialog,
  };
}
