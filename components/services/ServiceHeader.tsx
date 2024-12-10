'use client';

import { ServiceType } from '@/lib/db/services/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ServiceHeaderProps {
  selectedType: string;
  serviceTypes: ServiceType[];
  onTypeChange: (type: string) => void;
}

export function ServiceHeader({ selectedType, serviceTypes, onTypeChange }: ServiceHeaderProps) {
  return (
    <div className="space-y-4 pt-8 px-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Services
          </h1>
          <p className="text-lg text-gray-300 mt-1">
            View and register for upcoming services
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white backdrop-blur-sm">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {serviceTypes.map((type) => (
                <SelectItem key={type.id} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}
