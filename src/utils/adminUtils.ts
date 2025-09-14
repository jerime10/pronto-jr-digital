
import { supabase } from '@/integrations/supabase/client';

/**
 * Initializes the admin user and ensures proper database setup
 */
export const initializeAdmin = async () => {
  try {
    console.log('Initializing admin user...');
    
    // Call the create-admin edge function
    const { data, error } = await supabase.functions.invoke('create-admin', {
      body: {} // Ensure we send an empty body to avoid undefined errors
    });
    
    if (error) {
      console.error('Error initializing admin:', error);
      return {
        success: false,
        message: `Failed to initialize admin: ${error.message}`
      };
    }
    
    console.log('Admin initialization response:', data);
    
    return {
      success: true,
      message: data?.message || 'Admin initialized successfully',
      adminEmail: data?.adminEmail,
      adminPassword: data?.adminPassword
    };
  } catch (error) {
    console.error('Exception initializing admin:', error);
    return {
      success: false,
      message: `Exception initializing admin: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Checks if the current user is admin
 */
export const checkIfAdmin = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No user found or error checking admin');
      return false;
    }
    
    console.log('Checking if user is admin:', user.email);
    console.log('User app_metadata:', user.app_metadata);
    
    // Return true if the user's app_metadata contains is_admin: true
    return user.app_metadata?.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Clear auth state from storage for sign out
 */
export const cleanupAuthState = () => {
  console.log('Cleaning up auth state');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log('Removing from localStorage:', key);
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log('Removing from sessionStorage:', key);
      sessionStorage.removeItem(key);
    }
  });
};
