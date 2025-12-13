import { useQuery } from '@tanstack/react-query';
import { availabilityService } from '@/services/availabilityService';

interface Params {
  attendantId?: string;
  date?: string;
  serviceId?: string;
}

export function usePublicAvailability(params: Params) {
  const { attendantId, date, serviceId } = params;
  return useQuery({
    queryKey: ['public-availability', attendantId, date, serviceId],
    queryFn: async () => {
      if (!attendantId || !date) return { available_slots: [], success: true, date };
      const res = await availabilityService.checkAvailability(attendantId, date, serviceId);
      return res;
    },
    enabled: !!attendantId && !!date,
    staleTime: 60 * 1000,
  });
}
