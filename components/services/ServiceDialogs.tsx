'use client';

import { Service, ServiceType } from '@/lib/db/services/types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ServiceForm } from '@/components/admin/ServiceForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ServiceDialogsProps {
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

export function ServiceDialogs({
  editingService,
  deletingService,
  showForceDeleteDialog,
  serviceTypes,
  templeId,
  onEditClose,
  onDeleteClose,
  onForceDeleteClose,
  onServiceSaved,
  onConfirmDelete,
}: ServiceDialogsProps) {
  return (
    <>
      <Dialog open={editingService !== null} onOpenChange={onEditClose}>
        <DialogContent>
          <DialogTitle>
            {editingService ? 'Edit Service' : 'Add Service'}
          </DialogTitle>
          {editingService && (
            <ServiceForm
              service={editingService}
              serviceTypes={serviceTypes}
              onClose={onEditClose}
              onSuccess={onServiceSaved}
              templeId={templeId}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingService !== null} onOpenChange={onDeleteClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onConfirmDelete(false)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showForceDeleteDialog} onOpenChange={onForceDeleteClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Active Registrations</AlertDialogTitle>
            <AlertDialogDescription>
              This service has active registrations. Deleting it will also remove all associated registrations. 
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onConfirmDelete(true)} className="bg-red-600 hover:bg-red-700">
              Force Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
