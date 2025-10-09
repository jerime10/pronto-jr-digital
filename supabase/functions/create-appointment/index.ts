import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const appointmentData = await req.json()
    
    console.log('📅 [Edge Function] Creating appointment:', appointmentData)

    // Fazer insert direto sem validações complexas
    const { data: appointment, error } = await supabaseClient
      .from('appointments')
      .insert({
        patient_name: appointmentData.patient_name,
        patient_phone: appointmentData.patient_phone,
        patient_id: appointmentData.patient_id || null,
        attendant_id: appointmentData.attendant_id,
        attendant_name: appointmentData.attendant_name,
        service_id: appointmentData.service_id,
        service_name: appointmentData.service_name,
        service_price: appointmentData.service_price,
        service_duration: appointmentData.service_duration,
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        appointment_datetime: appointmentData.appointment_datetime,
        end_time: appointmentData.end_time || null,
        notes: appointmentData.notes || '',
        status: appointmentData.status || 'scheduled',
        dum: appointmentData.dum || null,
        gestational_age: appointmentData.gestational_age || null,
        estimated_due_date: appointmentData.estimated_due_date || null,
        partner_username: appointmentData.partner_username || null,
        partner_code: appointmentData.partner_code || null
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [Edge Function] Error:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('✅ [Edge Function] Appointment created:', appointment)
    
    return new Response(
      JSON.stringify({ success: true, data: appointment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ [Edge Function] Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
