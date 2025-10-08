
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0';

const adminEmail = 'admin';
const adminPassword = '260826';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create a Supabase client with the Auth Admin API key
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Check if admin user already exists
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

    if (searchError) {
      console.error('Error searching for admin user:', searchError);
      throw new Error('Failed to check for existing admin user');
    }

    let userId = null;
    let statusMessage = '';
    
    // Find the admin user if it exists
    const adminUser = existingUsers?.users?.find(user => user.email === adminEmail);
    if (adminUser) {
      userId = adminUser.id;
      console.log('Found existing admin user with ID:', userId);
    }

    if (!userId) {
      // Create admin user if doesn't exist
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Administrator',
          role: 'admin',
        },
        app_metadata: {
          is_admin: true,
          provider: 'email',
        },
      });

      if (error) {
        console.error('Error creating admin user:', error);
        throw new Error('Failed to create admin user');
      }

      userId = data.user.id;
      statusMessage = 'Admin user created successfully';
      console.log('Admin user created successfully with ID:', userId);
    } else {
      // Update existing user to make sure they have admin rights and password
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: adminPassword,
        user_metadata: {
          name: 'Administrator',
          role: 'admin',
        },
        app_metadata: {
          is_admin: true,
          provider: 'email',
        },
        email_confirm: true,
      });

      if (error) {
        console.error('Error updating admin user:', error);
        throw new Error('Failed to update admin user');
      }

      statusMessage = 'Admin user already exists, updated permissions and password';
      console.log('Admin user updated successfully with ID:', userId);
    }

    // Check for professional profile
    const { data: existingProfile } = await supabaseAdmin
      .from('professionals')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    // Create professional record for admin if it doesn't exist
    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin.from('professionals').insert({
        user_id: userId,
        name: 'Administrator',
        specialty: 'Administração',
        license_type: 'Admin',
        license_number: 'ADMIN-001',
        contact: adminEmail,
      });

      if (profileError) {
        console.error('Error creating admin professional record:', profileError);
      } else {
        statusMessage += ' with professional record';
        console.log('Added professional profile for admin user');
      }
    } else {
      console.log('Admin professional profile already exists');
    }

    // Apply RLS policies
    await applyRLSPolicies(supabaseAdmin);

    return new Response(
      JSON.stringify({
        success: true,
        message: statusMessage,
        adminEmail,
        adminPassword,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-admin function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function applyRLSPolicies(supabase: any) {
  try {
    // Enable RLS on all tables
    const tables = [
      'patients',
      'professionals',
      'medical_records',
      'prescription_models',
      'exam_models',
      'completed_exams',
      'site_settings',
    ];

    for (const table of tables) {
      try {
        // Enable RLS
        await supabase.rpc('pg_enable_row_level_security', { table_name: table });

        // Create policies for authenticated users
        // Policy for SELECT (all authenticated users can read)
        await supabase.rpc('create_auth_policy', {
          table_name: table,
          policy_name: `${table}_select_policy`,
          operation: 'SELECT',
          check_expression: 'true',
        });

        // Policy for INSERT (all authenticated users can insert)
        await supabase.rpc('create_auth_policy', {
          table_name: table,
          policy_name: `${table}_insert_policy`,
          operation: 'INSERT',
          check_expression: 'true',
        });

        // Policy for UPDATE (all authenticated users can update)
        await supabase.rpc('create_auth_policy', {
          table_name: table,
          policy_name: `${table}_update_policy`,
          operation: 'UPDATE',
          check_expression: 'true',
        });

        // Policy for DELETE (all authenticated users can delete)
        await supabase.rpc('create_auth_policy', {
          table_name: table,
          policy_name: `${table}_delete_policy`,
          operation: 'DELETE',
          check_expression: 'true',
        });
        
        console.log(`Applied RLS policies to table: ${table}`);
      } catch (error) {
        console.error(`Error setting RLS policies for table ${table}:`, error);
        // Continue with other tables even if one fails
      }
    }
  } catch (error) {
    console.error('Error applying RLS policies:', error);
  }
}
