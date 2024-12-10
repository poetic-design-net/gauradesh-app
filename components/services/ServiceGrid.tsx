'use client';

import { Service } from '@/lib/db/services/types';
import { ServiceIcon } from '@/components/services/ServiceIcon';
import { HeartHandshake, Edit, User, Phone, Clock, Calendar, Users } from 'lucide-react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';

interface ServiceGridProps {
  services: Service[];
  isAdmin: boolean;
  onRegister: (serviceId: string, message?: string) => Promise<void>;
  onUnregister?: (serviceId: string) => Promise<void>;
  onEdit?: (service: Service) => void;
  onDelete?: (service: Service) => void;
  userRegistrations?: Record<string, { status: 'pending' | 'approved' | 'rejected' }>;
}

interface WeeklyServices {
  [weekStart: string]: Service[];
}

export function ServiceGrid({ 
  services, 
  isAdmin, 
  onRegister,
  onUnregister,
  onEdit, 
  onDelete,
  userRegistrations = {}
}: ServiceGridProps) {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  if (services.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 px-6">
        <div className="text-center space-y-4 p-8 backdrop-blur-lg bg-white/10 rounded-lg border border-white/20">
          <HeartHandshake className="h-16 w-16 text-purple-400 mx-auto opacity-50" />
          <p className="text-xl text-gray-300">No services available at this time.</p>
        </div>
      </div>
    );
  }

  // Group services by week and sort by date within each week
  const groupedServices: WeeklyServices = services.reduce((acc, service) => {
    const serviceDate = service.date.toDate();
    const weekStart = startOfWeek(serviceDate, { weekStartsOn: 1 }); // Start week on Monday
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(service);
    return acc;
  }, {} as WeeklyServices);

  // Sort services within each week
  Object.keys(groupedServices).forEach(weekKey => {
    groupedServices[weekKey].sort((a, b) => 
      a.date.toDate().getTime() - b.date.toDate().getTime()
    );
  });

  const getRegistrationStatus = (serviceId: string) => {
    return userRegistrations[serviceId]?.status;
  };

  const isRegistrationDisabled = (service: Service) => {
    const status = getRegistrationStatus(service.id);
    return status === 'pending' || status === 'rejected' || service.currentParticipants >= service.maxParticipants;
  };

  const getRegistrationButtonText = (service: Service) => {
    const status = getRegistrationStatus(service.id);
    if (status === 'approved') return 'Unregister';
    if (status === 'pending') return 'Pending';
    if (status === 'rejected') return 'Rejected';
    if (service.currentParticipants >= service.maxParticipants) return 'Full';
    return 'Register';
  };

  const getRegistrationButtonClass = (service: Service) => {
    const status = getRegistrationStatus(service.id);
    const baseClass = "ml-4 px-4 py-2 rounded-md transition-colors";
    
    if (status === 'approved') return `${baseClass} bg-red-500/20 text-red-300 hover:bg-red-500/30`;
    if (status === 'pending') return `${baseClass} bg-yellow-500/20 text-yellow-300`;
    if (status === 'rejected') return `${baseClass} bg-red-500/20 text-red-300`;
    if (service.currentParticipants >= service.maxParticipants) 
      return `${baseClass} bg-gray-500/20 text-gray-300 cursor-not-allowed`;
    return `${baseClass} bg-purple-500/20 text-purple-300 hover:bg-purple-500/30`;
  };

  const handleRegistrationClick = async (e: React.MouseEvent, service: Service) => {
    e.stopPropagation();
    const status = getRegistrationStatus(service.id);
    
    if (status === 'approved' && onUnregister) {
      await onUnregister(service.id);
    } else if (!status && service.currentParticipants < service.maxParticipants) {
      await onRegister(service.id);
    }
  };

  return (
    <>
      <div className="space-y-8 p-6">
        {Object.entries(groupedServices).map(([weekStart, weekServices]) => {
          const startDate = new Date(weekStart);
          const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
          
          return (
            <div key={weekStart} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Week of {format(startDate, 'MMMM d')} - {format(endDate, 'MMMM d, yyyy')}
              </h3>
              <div className="grid gap-4">
                {weekServices.map((service) => {
                  const serviceDate = service.date.toDate();
                  const registrationStatus = getRegistrationStatus(service.id);
                  
                  return (
                    <div 
                      key={service.id} 
                      className="group transition-all duration-300 backdrop-blur-lg bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 cursor-pointer"
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-grow">
                            <div className="flex flex-col items-center min-w-[80px] p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
                              <span className="text-sm font-medium text-purple-300">
                                {format(serviceDate, 'EEE')}
                              </span>
                              <span className="text-lg font-bold text-white">
                                {format(serviceDate, 'd')}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 flex-grow">
                              <div className="p-2 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
                                <ServiceIcon 
                                  name={service.type} 
                                  className="h-5 w-5 text-purple-400"
                                  templeId={service.templeId} 
                                />
                              </div>
                              <div className="flex-grow">
                                <h4 className="text-white font-medium">{service.name}</h4>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-400">{service.type}</p>
                                  <div className="flex items-center gap-1 text-sm text-gray-400">
                                    <Users className="h-4 w-4" />
                                    <span>{service.currentParticipants}/{service.maxParticipants}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-400">
                                {service.timeSlot.start} - {service.timeSlot.end}
                              </div>
                              <button
                                onClick={(e) => handleRegistrationClick(e, service)}
                                disabled={isRegistrationDisabled(service)}
                                className={getRegistrationButtonClass(service)}
                              >
                                {getRegistrationButtonText(service)}
                              </button>
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2 ml-4">
                              {onEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(service);
                                  }}
                                  className="p-2 rounded-md hover:bg-white/10 transition-colors"
                                >
                                  <Edit className="h-4 w-4 text-purple-400" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="bg-white/10 backdrop-blur-lg border-white/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {selectedService?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-gray-300">
            {selectedService?.description && (
              <div className="space-y-2">
                <h4 className="font-medium text-white">Description</h4>
                <p className="text-sm">{selectedService.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-white">Date & Time</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{selectedService && format(selectedService.date.toDate(), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{selectedService?.timeSlot.start} - {selectedService?.timeSlot.end}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{selectedService?.currentParticipants}/{selectedService?.maxParticipants} participants</span>
                  </div>
                </div>
              </div>

              {selectedService?.contactPerson && (
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Service Leader</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4" />
                      <span>{selectedService.contactPerson.name}</span>
                    </div>
                    {selectedService.contactPerson.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4" />
                        <span>{selectedService.contactPerson.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedService?.notes && (
              <div className="space-y-2">
                <h4 className="font-medium text-white">Additional Notes</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedService.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              {selectedService && (
                <button
                  onClick={() => {
                    const status = getRegistrationStatus(selectedService.id);
                    if (status === 'approved' && onUnregister) {
                      onUnregister(selectedService.id);
                    } else if (!status && selectedService.currentParticipants < selectedService.maxParticipants) {
                      onRegister(selectedService.id);
                    }
                    setSelectedService(null);
                  }}
                  disabled={isRegistrationDisabled(selectedService)}
                  className={getRegistrationButtonClass(selectedService)}
                >
                  {getRegistrationButtonText(selectedService)}
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
