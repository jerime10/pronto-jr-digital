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
        db: {
          schema: 'public',
        },
      }
    )

    const appointmentData = await req.json()
    
    console.log('📅 [Edge Function] Creating appointment:', appointmentData)

    // Usar função SQL otimizada com timeout aumentado
    const { data: appointmentId, error } = await supabaseClient
      .rpc('insert_appointment', {
        p_patient_name: appointmentData.patient_name,
        p_patient_phone: appointmentData.patient_phone,
        p_patient_id: appointmentData.patient_id || null,
        p_attendant_id: appointmentData.attendant_id,
        p_attendant_name: appointmentData.attendant_name,
        p_service_id: appointmentData.service_id,
        p_service_name: appointmentData.service_name,
        p_service_price: appointmentData.service_price,
        p_service_duration: appointmentData.service_duration,
        p_appointment_date: appointmentData.appointment_date,
        p_appointment_time: appointmentData.appointment_time,
        p_appointment_datetime: appointmentData.appointment_datetime,
        p_end_time: appointmentData.end_time || null,
        p_notes: appointmentData.notes || '',
        p_status: appointmentData.status || 'scheduled',
        p_dum: appointmentData.dum || null,
        p_gestational_age: appointmentData.gestational_age || null,
        p_estimated_due_date: appointmentData.estimated_due_date || null,
        p_partner_username: appointmentData.partner_username || null,
        p_partner_code: appointmentData.partner_code || null,
        p_created_by_user_id: appointmentData.created_by_user_id || null
      })

    if (error) {
      console.error('❌ [Edge Function] Error:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('✅ [Edge Function] Appointment created successfully with ID:', appointmentId)
    
    // Enviar lembrete WhatsApp de forma assíncrona (background task)
    const sendReminderTask = async () => {
      try {
        // Aguardar 15 segundos antes de enviar
        await new Promise(resolve => setTimeout(resolve, 15000))
        
        console.log('📤 [Background] Sending WhatsApp reminder for appointment:', appointmentId)
        
        // Chamar edge function whatsapp-reminder
        const reminderResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-reminder`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              appointment_id: appointmentId,
              patient_name: appointmentData.patient_name,
              patient_phone: appointmentData.patient_phone,
              appointment_date: appointmentData.appointment_date,
              appointment_time: appointmentData.appointment_time,
              service_name: appointmentData.service_name,
              attendant_name: appointmentData.attendant_name,
              status: appointmentData.status || 'scheduled',
              reminder_type: '15s',
              partner_username: appointmentData.partner_username || null
            })
          }
        )
        
        if (reminderResponse.ok) {
          console.log('✅ [Background] WhatsApp reminder sent successfully')
        } else {
          const errorText = await reminderResponse.text()
          console.error('❌ [Background] Failed to send WhatsApp reminder:', errorText)
        }
      } catch (error) {
        console.error('❌ [Background] Error sending WhatsApp reminder:', error)
      }
    }
    
    // Executar tarefa em background sem bloquear resposta
    EdgeRuntime.waitUntil(sendReminderTask())
    
    return new Response(
      JSON.stringify({ success: true, data: { message: 'Agendamento criado com sucesso' } }),
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
