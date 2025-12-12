import { supabase } from '@/integrations/supabase/client';
import { Attendant, AttendantFormData } from '@/types/database';

// Fetch all attendants
export async function fetchAttendants(): Promise<Attendant[]> {
  try {
    const { data, error } = await supabase
      .from('attendants')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching attendants:', error);
      throw error;
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in attendants query:', err);
    throw err;
  }
}

// Fetch active attendants only
export async function fetchActiveAttendants(): Promise<Attendant[]> {
  try {
    const { data, error } = await supabase
      .from('attendants')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching active attendants:', error);
      throw error;
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in active attendants query:', err);
    throw err;
  }
}

// Fetch attendant by ID
export async function fetchAttendantById(id: string): Promise<Attendant | null> {
  try {
    const { data, error } = await supabase
      .from('attendants')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching attendant by ID:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Error in attendant by ID query:', err);
    throw err;
  }
}

// Create new attendant
export async function createAttendant(attendantData: AttendantFormData): Promise<Attendant> {
  try {
    const { data, error } = await supabase
      .from('attendants')
      .insert({
        name: attendantData.name,
        email: attendantData.email || null,
        phone: attendantData.phone || null,
        position: attendantData.position || null,
        photo_url: attendantData.photo_url || null,
        working_days: attendantData.working_days || null,
        share_link: attendantData.share_link || null,
        google_calendar_id: attendantData.google_calendar_id || null,
        is_active: attendantData.is_active ?? true,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating attendant:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Error in create attendant:', err);
    throw err;
  }
}

// Update attendant
export async function updateAttendant(id: string, attendantData: Partial<AttendantFormData>): Promise<Attendant> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (attendantData.name !== undefined) updateData.name = attendantData.name;
    if (attendantData.email !== undefined) updateData.email = attendantData.email || null;
    if (attendantData.phone !== undefined) updateData.phone = attendantData.phone || null;
    if (attendantData.position !== undefined) updateData.position = attendantData.position || null;
    if (attendantData.photo_url !== undefined) updateData.photo_url = attendantData.photo_url || null;
    if (attendantData.working_days !== undefined) updateData.working_days = attendantData.working_days || null;
    if (attendantData.share_link !== undefined) updateData.share_link = attendantData.share_link || null;
    if (attendantData.google_calendar_id !== undefined) updateData.google_calendar_id = attendantData.google_calendar_id || null;
    if (attendantData.is_active !== undefined) updateData.is_active = attendantData.is_active;
    
    const { data, error } = await supabase
      .from('attendants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating attendant:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Error in update attendant:', err);
    throw err;
  }
}

// Soft delete - mark as inactive
export async function deleteAttendant(id: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('attendants')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error('Nenhuma linha foi atualizada');
    }
  } catch (err) {
    throw err;
  }
}

// Permanently delete attendant (hard delete)
export async function permanentlyDeleteAttendant(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('attendants')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error permanently deleting attendant:', error);
      throw error;
    }
  } catch (err) {
    console.error('Error in permanently delete attendant:', err);
    throw err;
  }
}

// Search attendants by name or email
export async function searchAttendants(searchTerm: string): Promise<Attendant[]> {
  try {
    const { data, error } = await supabase
      .from('attendants')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error searching attendants:', error);
      throw error;
    }
    
    return data || [];
  } catch (err) {
    console.error('Error in search attendants:', err);
    throw err;
  }
}

// Toggle attendant active status
export async function toggleAttendantStatus(id: string): Promise<Attendant> {
  try {
    // First get current status
    const currentAttendant = await fetchAttendantById(id);
    if (!currentAttendant) {
      throw new Error('Attendant not found');
    }
    
    const { data, error } = await supabase
      .from('attendants')
      .update({ 
        is_active: !currentAttendant.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error toggling attendant status:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Error in toggle attendant status:', err);
    throw err;
  }
}