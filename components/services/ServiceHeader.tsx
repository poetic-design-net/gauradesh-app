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
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r text-white">
            Temple Services
          </h1>
          <p className="text-xl text-gray-300">
            Discover and participate in various spiritual services
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
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
    </div>
  );
}
