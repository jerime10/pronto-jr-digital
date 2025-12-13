import { useQuery } from '@tanstack/react-query';
import { serviceAssignmentService, ServiceAssignment } from '@/services/serviceAssignmentService';

export function useAttendantServices(attendantId?: string) {
  return useQuery<ServiceAssignment[]>({
    queryKey: ['attendant-services', attendantId],
    queryFn: () => attendantId ? serviceAssignmentService.getAssignmentsByAttendant(attendantId) : Promise.resolve([]),
    enabled: !!attendantId,
    staleTime: 5 * 60 * 1000,
  });
}
