'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTempleContext } from '@/contexts/TempleContext';
import { HeartHandshake } from 'lucide-react';
import { useServices } from '@/hooks/useServices';
import { 
  ServiceHeader, 
  ServiceGrid, 
  ServiceDialogs,
  ServiceLoading
} from '@/components/services';
import { useEffect } from 'react';
import { subscribeToTempleServices } from '@/lib/db/services/services-optimized';

export default function ServicesPage() {
  const { user } = useAuth();
  const { currentTemple } = useTempleContext();

  const {
    services,
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
  } = useServices(user?.uid || null, currentTemple?.id || null);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentTemple?.id) return;

    const unsubscribe = subscribeToTempleServices(
      currentTemple.id,
      (updatedServices) => {
        setServices(updatedServices);
      },
      {
        orderByField: 'date',
        orderDirection: 'desc'
      }
    );

    return () => unsubscribe();
  }, [currentTemple?.id, setServices]);

  if (!currentTemple) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4 p-8 bg-white/10 rounded-lg border border-white/20">
          <HeartHandshake className="h-16 w-16 text-purple-400 mx-auto opacity-50" />
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            No Temple Selected
          </h1>
          <p className="text-gray-300">Please select a temple to view available services.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <ServiceLoading />;
  }

  return (
    <>
      <div className="animate-in fade-in duration-500">
        <ServiceHeader
          selectedType={selectedType}
          serviceTypes={serviceTypes}
          onTypeChange={setSelectedType}
        />

        <ServiceGrid
          services={services}
          isAdmin={isAdmin}
          onRegister={handleRegister}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <ServiceDialogs
        editingService={editingService}
        deletingService={deletingService}
        showForceDeleteDialog={showForceDeleteDialog}
        serviceTypes={serviceTypes}
        templeId={currentTemple.id}
        onEditClose={() => setEditingService(null)}
        onDeleteClose={() => setDeletingService(null)}
        onForceDeleteClose={() => setShowForceDeleteDialog(false)}
        onServiceSaved={handleServiceSaved}
        onConfirmDelete={confirmDelete}
      />
    </>
  );
}
