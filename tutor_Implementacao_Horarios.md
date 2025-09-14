# Guia de Implementação - Sistema de Horários

## Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados](#estrutura-de-dados)
3. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
4. [Implementação Backend](#implementação-backend)
5. [APIs REST](#apis-rest)
6. [Integração com Sistema Existente](#integração-com-sistema-existente)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Testes Automatizados](#testes-automatizados)
9. [Deploy e Produção](#deploy-e-produção)
10. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O sistema de horários do AgendaPro4 é responsável por:

- **Gerenciar horários de trabalho** dos atendentes
- **Calcular disponibilidade** em tempo real
- **Controlar agendamentos** e conflitos
- **Otimizar slots** de tempo disponíveis
- **Integrar com múltiplos serviços** e durações

### Componentes Principais

- **ScheduleService.php**: Lógica principal de horários
- **Tabelas de dados**: schedules, schedule_assignments, appointments
- **APIs REST**: Endpoints para consulta e manipulação
- **Sistema de cache**: Otimização de performance

---

## Estrutura de Dados

### 1. Tabela Principal: `schedules`

```sql
CREATE TABLE schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Domingo, 1=Segunda, ..., 6=Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Tabela de Atribuições: `schedule_assignments`

```sql
CREATE TABLE schedule_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    specific_date DATE, -- Para horários específicos
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    schedule_info TEXT, -- Informações adicionais
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Tabela de Agendamentos: `appointments`

```sql
CREATE TABLE appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    attendant_id UUID REFERENCES attendants(id),
    service_id UUID REFERENCES services(id),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Configuração do Banco de Dados

### 1. Criação das Tabelas

```sql
-- ============================================
-- SCRIPT DE CRIAÇÃO - SISTEMA DE HORÁRIOS
-- ============================================

-- 1. Criar tabela de horários base
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de atribuições de horário
CREATE TABLE IF NOT EXISTS schedule_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    specific_date DATE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    schedule_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID,
    attendant_id UUID REFERENCES attendants(id),
    service_id UUID REFERENCES services(id),
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Índices para Performance

```sql
-- Índices para tabela schedules
CREATE INDEX IF NOT EXISTS idx_schedules_attendant ON schedules(attendant_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day_of_week);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_attendant_day_active ON schedules(attendant_id, day_of_week, is_active) WHERE is_active = true;

-- Índices para tabela schedule_assignments
CREATE INDEX IF NOT EXISTS idx_assignments_attendant ON schedule_assignments(attendant_id);
CREATE INDEX IF NOT EXISTS idx_assignments_service ON schedule_assignments(service_id);
CREATE INDEX IF NOT EXISTS idx_assignments_schedule ON schedule_assignments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON schedule_assignments(specific_date);
CREATE INDEX IF NOT EXISTS idx_assignments_available ON schedule_assignments(is_available);

-- Índices para tabela appointments
CREATE INDEX IF NOT EXISTS idx_appointments_attendant ON appointments(attendant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_attendant_date ON appointments(attendant_id, appointment_date);
```

### 3. Políticas de Segurança (RLS)

```sql
-- Habilitar RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura
CREATE POLICY "Allow read schedules" ON schedules
    FOR SELECT USING (true);

CREATE POLICY "Allow read assignments" ON schedule_assignments
    FOR SELECT USING (true);

CREATE POLICY "Allow read appointments" ON appointments
    FOR SELECT USING (true);

-- Políticas de escrita (ajustar conforme necessário)
CREATE POLICY "Allow insert schedules" ON schedules
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update schedules" ON schedules
    FOR UPDATE USING (true);

CREATE POLICY "Allow insert assignments" ON schedule_assignments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update assignments" ON schedule_assignments
    FOR UPDATE USING (true);

CREATE POLICY "Allow insert appointments" ON appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update appointments" ON appointments
    FOR UPDATE USING (true);
```

---

## Implementação Backend

### 1. Classe ScheduleService

```php
<?php
/**
 * Class ScheduleService
 * 
 * Responsável por gerenciar agendas, horários disponíveis e consultas de disponibilidade
 */
class ScheduleService {
    private $supabaseUrl;
    private $supabaseKey;
    
    public function __construct($supabaseUrl, $supabaseKey) {
        $this->supabaseUrl = $supabaseUrl;
        $this->supabaseKey = $supabaseKey;
    }
    
    /**
     * Obtém horários disponíveis para um atendente em uma data específica
     */
    public function getAvailableTimeSlots($attendantId, $serviceId, $date) {
        try {
            // Validar entrada
            if (!$this->isValidDate($date)) {
                throw new Exception('Data inválida');
            }
            
            $dayOfWeek = $this->getDayOfWeek($date);
            
            // Verificar se o atendente existe
            $attendant = $this->getAttendantById($attendantId);
            if (!$attendant) {
                throw new Exception('Atendente não encontrado');
            }
            
            // Obter duração do serviço
            $service = $this->getServiceById($serviceId);
            if (!$service) {
                throw new Exception('Serviço não encontrado');
            }
            
            $serviceDuration = $service['duration_minutes'] ?? 60;
            
            // Obter horários do atendente
            $schedules = $this->getAttendantSchedules($attendantId, $dayOfWeek);
            
            if (empty($schedules)) {
                return [
                    'success' => true,
                    'available_slots' => [],
                    'message' => 'Atendente não possui horários configurados para este dia'
                ];
            }
            
            // Obter agendamentos já marcados
            $bookedAppointments = $this->getBookedAppointments($attendantId, $date);
            
            // Calcular slots disponíveis
            $availableSlots = $this->calculateAvailableSlots($schedules, $bookedAppointments, $serviceDuration);
            
            return [
                'success' => true,
                'available_slots' => $availableSlots,
                'attendant' => $attendant['name'],
                'service' => $service['name'],
                'date' => $date,
                'day_of_week' => $dayOfWeek
            ];
            
        } catch (Exception $e) {
            error_log("Erro ao obter horários disponíveis: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Obtém calendário de disponibilidade para um período
     */
    public function getAvailabilityCalendar($attendantId, $startDate, $endDate, $serviceId = null) {
        try {
            $calendar = [];
            $currentDate = new DateTime($startDate);
            $endDateTime = new DateTime($endDate);
            
            while ($currentDate <= $endDateTime) {
                $dateStr = $currentDate->format('Y-m-d');
                $dayOfWeek = $this->getDayOfWeek($dateStr);
                
                // Verificar se o atendente trabalha neste dia
                $schedules = $this->getAttendantSchedules($attendantId, $dayOfWeek);
                
                if (!empty($schedules)) {
                    $serviceDuration = 60; // Padrão
                    
                    if ($serviceId) {
                        $service = $this->getServiceById($serviceId);
                        $serviceDuration = $service['duration_minutes'] ?? 60;
                    }
                    
                    $bookedAppointments = $this->getBookedAppointments($attendantId, $dateStr);
                    $availableSlots = $this->calculateAvailableSlots($schedules, $bookedAppointments, $serviceDuration);
                    
                    $calendar[$dateStr] = [
                        'date' => $dateStr,
                        'day_of_week' => $dayOfWeek,
                        'is_available' => !empty($availableSlots),
                        'total_slots' => count($availableSlots),
                        'slots' => $availableSlots
                    ];
                } else {
                    $calendar[$dateStr] = [
                        'date' => $dateStr,
                        'day_of_week' => $dayOfWeek,
                        'is_available' => false,
                        'total_slots' => 0,
                        'slots' => []
                    ];
                }
                
                $currentDate->add(new DateInterval('P1D'));
            }
            
            return [
                'success' => true,
                'calendar' => $calendar,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ];
            
        } catch (Exception $e) {
            error_log("Erro ao obter calendário: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Verifica disponibilidade de um horário específico
     */
    public function checkSpecificTimeAvailability($attendantId, $serviceId, $date, $time) {
        try {
            // Validar entrada
            if (!$this->isValidDate($date) || !$this->isValidTime($time)) {
                throw new Exception('Data ou horário inválido');
            }
            
            // Obter duração do serviço
            $service = $this->getServiceById($serviceId);
            if (!$service) {
                throw new Exception('Serviço não encontrado');
            }
            
            $serviceDuration = $service['duration_minutes'] ?? 60;
            
            // Obter todos os slots disponíveis
            $slotsResult = $this->getAvailableTimeSlots($attendantId, $serviceId, $date);
            
            if (!$slotsResult['success']) {
                return $slotsResult;
            }
            
            $availableSlots = $slotsResult['available_slots'];
            
            // Verificar se o horário solicitado está disponível
            $requestedTime = $time;
            $isAvailable = false;
            
            foreach ($availableSlots as $slot) {
                if ($slot['start_time'] === $requestedTime) {
                    $isAvailable = true;
                    break;
                }
            }
            
            return [
                'success' => true,
                'is_available' => $isAvailable,
                'requested_time' => $requestedTime,
                'service_duration' => $serviceDuration,
                'alternative_slots' => $isAvailable ? [] : array_slice($availableSlots, 0, 5)
            ];
            
        } catch (Exception $e) {
            error_log("Erro ao verificar disponibilidade específica: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
```

### 2. Métodos Auxiliares

```php
    /**
     * Obtém horários configurados para um atendente em um dia da semana
     */
    private function getAttendantSchedules($attendantId, $dayOfWeek) {
        try {
            // Obter schedule_assignments para o atendente
            $scheduleAssignments = $this->makeSupabaseRequest(
                "/rest/v1/schedule_assignments",
                "GET",
                null,
                [
                    'select' => 'id,schedule_id,schedule_info',
                    'attendant_id' => "eq.$attendantId"
                ]
            );
            
            if (empty($scheduleAssignments)) {
                return [];
            }
            
            $scheduleIds = array_map(function($assignment) {
                return $assignment['schedule_id'];
            }, $scheduleAssignments);
            
            if (empty($scheduleIds)) {
                return [];
            }
            
            // Consultar schedules individuais
            $validSchedules = [];
            
            foreach ($scheduleIds as $scheduleId) {
                $schedule = $this->makeSupabaseRequest(
                    "/rest/v1/schedules",
                    "GET",
                    null,
                    [
                        'id' => "eq.$scheduleId",
                        'day_of_week' => "eq.$dayOfWeek",
                        'is_active' => 'eq.true'
                    ]
                );
                
                if (!empty($schedule)) {
                    $validSchedules[] = $schedule[0];
                }
            }
            
            return $validSchedules;
            
        } catch (Exception $e) {
            error_log("Erro ao obter horários do atendente: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Obtém agendamentos já marcados para um atendente em uma data
     */
    private function getBookedAppointments($attendantId, $date) {
        try {
            $appointments = $this->makeSupabaseRequest(
                "/rest/v1/appointments",
                "GET",
                null,
                [
                    'attendant_id' => "eq.$attendantId",
                    'appointment_date' => "eq.$date",
                    'status' => 'in.(scheduled,confirmed)'
                ]
            );
            
            return $appointments ?: [];
            
        } catch (Exception $e) {
            error_log("Erro ao obter agendamentos: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Calcula slots de tempo disponíveis
     */
    private function calculateAvailableSlots($schedules, $bookedAppointments, $serviceDuration) {
        $availableSlots = [];
        $today = date('Y-m-d');
        $currentTime = date('H:i:s');
        
        // Verificar se é hoje para filtrar horários passados
        $isToday = false;
        if (isset($schedules[0]['date']) && $schedules[0]['date'] === $today) {
            $isToday = true;
        }
        
        foreach ($schedules as $schedule) {
            $startTime = $schedule['start_time'];
            $endTime = $schedule['end_time'];
            
            // Converter para minutos para facilitar cálculos
            $startMinutes = $this->timeToMinutes($startTime);
            $endMinutes = $this->timeToMinutes($endTime);
            $currentMinutes = $this->timeToMinutes($currentTime);
            
            // Gerar slots de tempo
            for ($time = $startMinutes; $time + $serviceDuration <= $endMinutes; $time += $serviceDuration) {
                $slotStart = $this->minutesToTime($time);
                $slotEnd = $this->minutesToTime($time + $serviceDuration);
                
                // Pular horários passados se for hoje
                if ($isToday && $time <= $currentMinutes) {
                    continue;
                }
                
                // Verificar conflitos com agendamentos existentes
                $hasConflict = false;
                foreach ($bookedAppointments as $appointment) {
                    $appointmentStart = $this->timeToMinutes($appointment['start_time']);
                    $appointmentEnd = $this->timeToMinutes($appointment['end_time']);
                    
                    // Verificar sobreposição
                    if (($time < $appointmentEnd) && ($time + $serviceDuration > $appointmentStart)) {
                        $hasConflict = true;
                        break;
                    }
                }
                
                if (!$hasConflict) {
                    $availableSlots[] = [
                        'start_time' => $slotStart,
                        'end_time' => $slotEnd,
                        'duration_minutes' => $serviceDuration
                    ];
                }
            }
        }
        
        // Ordenar slots por horário
        usort($availableSlots, function($a, $b) {
            return strcmp($a['start_time'], $b['start_time']);
        });
        
        return $availableSlots;
    }
    
    /**
     * Utilitários de tempo
     */
    private function timeToMinutes($time) {
        $parts = explode(':', $time);
        return ($parts[0] * 60) + $parts[1];
    }
    
    private function minutesToTime($minutes) {
        $hours = floor($minutes / 60);
        $mins = $minutes % 60;
        return sprintf('%02d:%02d:00', $hours, $mins);
    }
    
    private function getDayOfWeek($date) {
        return date('w', strtotime($date)); // 0=Domingo, 1=Segunda, etc.
    }
    
    private function isValidDate($date) {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }
    
    private function isValidTime($time) {
        return preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', $time);
    }
    
    /**
     * Busca atendente por ID
     */
    private function getAttendantById($attendantId) {
        try {
            $result = $this->makeSupabaseRequest(
                "/rest/v1/attendants",
                "GET",
                null,
                [
                    'id' => "eq.$attendantId",
                    'is_active' => 'eq.true'
                ]
            );
            
            return !empty($result) ? $result[0] : null;
            
        } catch (Exception $e) {
            error_log("Erro ao buscar atendente: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Busca serviço por ID
     */
    private function getServiceById($serviceId) {
        try {
            $result = $this->makeSupabaseRequest(
                "/rest/v1/services",
                "GET",
                null,
                [
                    'id' => "eq.$serviceId",
                    'is_active' => 'eq.true'
                ]
            );
            
            return !empty($result) ? $result[0] : null;
            
        } catch (Exception $e) {
            error_log("Erro ao buscar serviço: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Faz requisições para o Supabase
     */
    private function makeSupabaseRequest($endpoint, $method = 'GET', $data = null, $params = []) {
        $url = $this->supabaseUrl . $endpoint;
        
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
        
        $headers = [
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $this->supabaseKey,
            'Content-Type: application/json'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 400) {
            throw new Exception("Erro na requisição: HTTP $httpCode - $response");
        }
        
        return json_decode($response, true);
    }
}
```

---

## APIs REST

### 1. Endpoint Principal (index.php)

```php
<?php
require_once 'config.php';
require_once 'ScheduleService.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $config = new ConfigManager();
    $scheduleService = new ScheduleService(
        $config->get('SUPABASE_URL'),
        $config->get('SUPABASE_SERVICE_KEY')
    );
    
    $requestUri = $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Roteamento
    if (preg_match('/\/webhook\/schedule\/available-slots/', $requestUri)) {
        handleAvailableSlots($scheduleService, $method, $input);
    } elseif (preg_match('/\/webhook\/schedule\/calendar/', $requestUri)) {
        handleCalendar($scheduleService, $method, $input);
    } elseif (preg_match('/\/webhook\/schedule\/check-availability/', $requestUri)) {
        handleCheckAvailability($scheduleService, $method, $input);
    } elseif (preg_match('/\/webhook\/schedule\/manage/', $requestUri)) {
        handleManageSchedule($scheduleService, $method, $input);
    } else {
        throw new Exception('Endpoint não encontrado');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

/**
 * Manipula consulta de horários disponíveis
 */
function handleAvailableSlots($scheduleService, $method, $input) {
    if ($method !== 'GET') {
        throw new Exception('Método não permitido');
    }
    
    $attendantId = $_GET['attendant_id'] ?? null;
    $serviceId = $_GET['service_id'] ?? null;
    $date = $_GET['date'] ?? null;
    
    if (!$attendantId || !$serviceId || !$date) {
        throw new Exception('Parâmetros obrigatórios: attendant_id, service_id, date');
    }
    
    $result = $scheduleService->getAvailableTimeSlots($attendantId, $serviceId, $date);
    echo json_encode($result);
}

/**
 * Manipula consulta de calendário
 */
function handleCalendar($scheduleService, $method, $input) {
    if ($method !== 'GET') {
        throw new Exception('Método não permitido');
    }
    
    $attendantId = $_GET['attendant_id'] ?? null;
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;
    $serviceId = $_GET['service_id'] ?? null;
    
    if (!$attendantId || !$startDate || !$endDate) {
        throw new Exception('Parâmetros obrigatórios: attendant_id, start_date, end_date');
    }
    
    $result = $scheduleService->getAvailabilityCalendar($attendantId, $startDate, $endDate, $serviceId);
    echo json_encode($result);
}

/**
 * Manipula verificação de disponibilidade específica
 */
function handleCheckAvailability($scheduleService, $method, $input) {
    if ($method !== 'POST') {
        throw new Exception('Método não permitido');
    }
    
    $attendantId = $input['attendant_id'] ?? null;
    $serviceId = $input['service_id'] ?? null;
    $date = $input['date'] ?? null;
    $time = $input['time'] ?? null;
    
    if (!$attendantId || !$serviceId || !$date || !$time) {
        throw new Exception('Parâmetros obrigatórios: attendant_id, service_id, date, time');
    }
    
    $result = $scheduleService->checkSpecificTimeAvailability($attendantId, $serviceId, $date, $time);
    echo json_encode($result);
}

/**
 * Manipula gerenciamento de horários
 */
function handleManageSchedule($scheduleService, $method, $input) {
    if ($method !== 'POST') {
        throw new Exception('Método não permitido');
    }
    
    $attendantId = $input['attendant_id'] ?? null;
    $schedules = $input['schedules'] ?? [];
    
    if (!$attendantId || empty($schedules)) {
        throw new Exception('Parâmetros obrigatórios: attendant_id, schedules');
    }
    
    // Implementar lógica de gerenciamento de horários
    // (criar, atualizar, remover schedules e schedule_assignments)
    
    echo json_encode([
        'success' => true,
        'message' => 'Horários atualizados com sucesso'
    ]);
}
?>
```

---

## Integração com Sistema Existente

### 1. Configuração do Ambiente

```bash
# .env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_KEY=sua_chave_servico
TIMEZONE=America/Sao_Paulo
DEBUG_MODE=true

# Configurações de horários
DEFAULT_SLOT_DURATION=60
BUFFER_TIME_MINUTES=15
MAX_ADVANCE_DAYS=90
MIN_ADVANCE_HOURS=2
```

### 2. Integração Frontend (JavaScript)

```javascript
/**
 * Cliente JavaScript para integração com APIs de horários
 */
class ScheduleClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    /**
     * Obtém horários disponíveis
     */
    async getAvailableSlots(attendantId, serviceId, date) {
        try {
            const params = new URLSearchParams({
                attendant_id: attendantId,
                service_id: serviceId,
                date: date
            });
            
            const response = await fetch(`${this.baseUrl}/webhook/schedule/available-slots?${params}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Erro ao obter horários');
            }
            
            return data;
            
        } catch (error) {
            console.error('Erro ao buscar horários disponíveis:', error);
            throw error;
        }
    }
    
    /**
     * Obtém calendário de disponibilidade
     */
    async getAvailabilityCalendar(attendantId, startDate, endDate, serviceId = null) {
        try {
            const params = new URLSearchParams({
                attendant_id: attendantId,
                start_date: startDate,
                end_date: endDate
            });
            
            if (serviceId) {
                params.append('service_id', serviceId);
            }
            
            const response = await fetch(`${this.baseUrl}/webhook/schedule/calendar?${params}`);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Erro ao obter calendário');
            }
            
            return data;
            
        } catch (error) {
            console.error('Erro ao buscar calendário:', error);
            throw error;
        }
    }
    
    /**
     * Verifica disponibilidade específica
     */
    async checkSpecificAvailability(attendantId, serviceId, date, time) {
        try {
            const response = await fetch(`${this.baseUrl}/webhook/schedule/check-availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    attendant_id: attendantId,
                    service_id: serviceId,
                    date: date,
                    time: time
                })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Erro ao verificar disponibilidade');
            }
            
            return data;
            
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            throw error;
        }
    }
    
    /**
     * Renderiza horários disponíveis em um elemento
     */
    renderAvailableSlots(slots, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container não encontrado:', containerId);
            return;
        }
        
        container.innerHTML = '';
        
        if (slots.length === 0) {
            container.innerHTML = '<p class="no-slots">Nenhum horário disponível</p>';
            return;
        }
        
        const slotsHtml = slots.map(slot => `
            <button class="time-slot" data-time="${slot.start_time}">
                ${this.formatTime(slot.start_time)} - ${this.formatTime(slot.end_time)}
            </button>
        `).join('');
        
        container.innerHTML = `<div class="slots-grid">${slotsHtml}</div>`;
        
        // Adicionar event listeners
        container.querySelectorAll('.time-slot').forEach(button => {
            button.addEventListener('click', (e) => {
                const selectedTime = e.target.dataset.time;
                this.onSlotSelected(selectedTime);
            });
        });
    }
    
    /**
     * Renderiza calendário de disponibilidade
     */
    renderCalendar(calendar, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container não encontrado:', containerId);
            return;
        }
        
        const calendarHtml = Object.entries(calendar).map(([date, dayInfo]) => {
            const isAvailable = dayInfo.is_available;
            const slotsCount = dayInfo.total_slots;
            
            return `
                <div class="calendar-day ${isAvailable ? 'available' : 'unavailable'}" data-date="${date}">
                    <div class="date">${this.formatDate(date)}</div>
                    <div class="slots-info">
                        ${isAvailable ? `${slotsCount} horários` : 'Indisponível'}
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `<div class="calendar-grid">${calendarHtml}</div>`;
        
        // Adicionar event listeners
        container.querySelectorAll('.calendar-day.available').forEach(day => {
            day.addEventListener('click', (e) => {
                const selectedDate = e.currentTarget.dataset.date;
                this.onDateSelected(selectedDate);
            });
        });
    }
    
    /**
     * Callbacks para eventos
     */
    onSlotSelected(time) {
        console.log('Horário selecionado:', time);
        // Implementar lógica personalizada
    }
    
    onDateSelected(date) {
        console.log('Data selecionada:', date);
        // Implementar lógica personalizada
    }
    
    /**
     * Utilitários de formatação
     */
    formatTime(time) {
        return time.substring(0, 5); // Remove segundos
    }
    
    formatDate(date) {
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
    }
}

// Exemplo de uso
const scheduleClient = new ScheduleClient('https://seu-dominio.com');

// Buscar horários disponíveis
scheduleClient.getAvailableSlots('attendant-id', 'service-id', '2024-12-20')
    .then(result => {
        console.log('Horários disponíveis:', result.available_slots);
        scheduleClient.renderAvailableSlots(result.available_slots, 'slots-container');
    })
    .catch(error => {
        console.error('Erro:', error);
    });

// Buscar calendário
scheduleClient.getAvailabilityCalendar('attendant-id', '2024-12-01', '2024-12-31')
    .then(result => {
        console.log('Calendário:', result.calendar);
        scheduleClient.renderCalendar(result.calendar, 'calendar-container');
    })
    .catch(error => {
        console.error('Erro:', error);
    });
```

### 3. Estilos CSS

```css
/* Estilos para componentes de horários */
.slots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
    margin: 20px 0;
}

.time-slot {
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    text-align: center;
}

.time-slot:hover {
    border-color: #2196F3;
    background: #f5f5f5;
}

.time-slot.selected {
    border-color: #2196F3;
    background: #2196F3;
    color: white;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    margin: 20px 0;
}

.calendar-day {
    padding: 12px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.calendar-day.available {
    background: #e8f5e8;
    border-color: #4caf50;
}

.calendar-day.available:hover {
    background: #c8e6c9;
}

.calendar-day.unavailable {
    background: #f5f5f5;
    color: #999;
    cursor: not-allowed;
}

.calendar-day .date {
    font-weight: bold;
    margin-bottom: 4px;
}

.calendar-day .slots-info {
    font-size: 12px;
    color: #666;
}

.no-slots {
    text-align: center;
    padding: 40px;
    color: #666;
    font-style: italic;
}
```

---

## Exemplos Práticos

### 1. Consulta de Horários Disponíveis

```bash
# GET - Obter horários disponíveis
curl -X GET "http://seu-dominio/webhook/schedule/available-slots?attendant_id=uuid-do-atendente&service_id=uuid-do-servico&date=2024-12-20"

# Resposta esperada:
{
    "success": true,
    "available_slots": [
        {
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "duration_minutes": 60
        },
        {
            "start_time": "10:00:00",
            "end_time": "11:00:00",
            "duration_minutes": 60
        }
    ],
    "attendant": "Dr. João Silva",
    "service": "Consulta Médica",
    "date": "2024-12-20",
    "day_of_week": 5
}
```

### 2. Consulta de Calendário

```bash
# GET - Obter calendário de disponibilidade
curl -X GET "http://seu-dominio/webhook/schedule/calendar?attendant_id=uuid-do-atendente&start_date=2024-12-01&end_date=2024-12-31&service_id=uuid-do-servico"

# Resposta esperada:
{
    "success": true,
    "calendar": {
        "2024-12-20": {
            "date": "2024-12-20",
            "day_of_week": 5,
            "is_available": true,
            "total_slots": 8,
            "slots": [...]
        },
        "2024-12-21": {
            "date": "2024-12-21",
            "day_of_week": 6,
            "is_available": false,
            "total_slots": 0,
            "slots": []
        }
    },
    "period": {
        "start_date": "2024-12-01",
        "end_date": "2024-12-31"
    }
}
```

### 3. Verificação de Disponibilidade Específica

```bash
# POST - Verificar horário específico
curl -X POST "http://seu-dominio/webhook/schedule/check-availability" \
  -H "Content-Type: application/json" \
  -d '{
    "attendant_id": "uuid-do-atendente",
    "service_id": "uuid-do-servico",
    "date": "2024-12-20",
    "time": "09:00:00"
  }'

# Resposta esperada:
{
    "success": true,
    "is_available": true,
    "requested_time": "09:00:00",
    "service_duration": 60,
    "alternative_slots": []
}
```

### 4. Gerenciamento de Horários

```bash
# POST - Configurar horários de trabalho
curl -X POST "http://seu-dominio/webhook/schedule/manage" \
  -H "Content-Type: application/json" \
  -d '{
    "attendant_id": "uuid-do-atendente",
    "schedules": [
        {
            "day_of_week": 1,
            "start_time": "08:00:00",
            "end_time": "12:00:00"
        },
        {
            "day_of_week": 1,
            "start_time": "14:00:00",
            "end_time": "18:00:00"
        },
        {
            "day_of_week": 2,
            "start_time": "08:00:00",
            "end_time": "17:00:00"
        }
    ]
  }'
```

---

## Testes Automatizados

### 1. Testes de Unidade (PHP)

```php
<?php
/**
 * Testes para ScheduleService
 */
class ScheduleServiceTest extends PHPUnit\Framework\TestCase {
    private $scheduleService;
    private $mockSupabaseUrl = 'https://test.supabase.co';
    private $mockSupabaseKey = 'test-key';
    
    protected function setUp(): void {
        $this->scheduleService = new ScheduleService(
            $this->mockSupabaseUrl,
            $this->mockSupabaseKey
        );
    }
    
    /**
     * Testa obtenção de horários disponíveis
     */
    public function testGetAvailableTimeSlots() {
        $attendantId = 'test-attendant-id';
        $serviceId = 'test-service-id';
        $date = '2024-12-20';
        
        $result = $this->scheduleService->getAvailableTimeSlots($attendantId, $serviceId, $date);
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('success', $result);
        $this->assertArrayHasKey('available_slots', $result);
    }
    
    /**
     * Testa validação de data
     */
    public function testDateValidation() {
        $attendantId = 'test-attendant-id';
        $serviceId = 'test-service-id';
        $invalidDate = 'invalid-date';
        
        $result = $this->scheduleService->getAvailableTimeSlots($attendantId, $serviceId, $invalidDate);
        
        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Data inválida', $result['error']);
    }
    
    /**
     * Testa cálculo de slots disponíveis
     */
    public function testCalculateAvailableSlots() {
        $schedules = [
            [
                'start_time' => '09:00:00',
                'end_time' => '17:00:00'
            ]
        ];
        
        $bookedAppointments = [
            [
                'start_time' => '10:00:00',
                'end_time' => '11:00:00'
            ]
        ];
        
        $serviceDuration = 60;
        
        // Usar reflexão para testar método privado
        $reflection = new ReflectionClass($this->scheduleService);
        $method = $reflection->getMethod('calculateAvailableSlots');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->scheduleService, $schedules, $bookedAppointments, $serviceDuration);
        
        $this->assertIsArray($result);
        $this->assertGreaterThan(0, count($result));
        
        // Verificar se o horário ocupado não está nos slots disponíveis
        $occupiedSlot = array_filter($result, function($slot) {
            return $slot['start_time'] === '10:00:00';
        });
        
        $this->assertEmpty($occupiedSlot);
    }
    
    /**
     * Testa conversão de tempo para minutos
     */
    public function testTimeToMinutes() {
        $reflection = new ReflectionClass($this->scheduleService);
        $method = $reflection->getMethod('timeToMinutes');
        $method->setAccessible(true);
        
        $this->assertEquals(540, $method->invoke($this->scheduleService, '09:00:00')); // 9 * 60
        $this->assertEquals(630, $method->invoke($this->scheduleService, '10:30:00')); // 10 * 60 + 30
    }
    
    /**
     * Testa conversão de minutos para tempo
     */
    public function testMinutesToTime() {
        $reflection = new ReflectionClass($this->scheduleService);
        $method = $reflection->getMethod('minutesToTime');
        $method->setAccessible(true);
        
        $this->assertEquals('09:00:00', $method->invoke($this->scheduleService, 540));
        $this->assertEquals('10:30:00', $method->invoke($this->scheduleService, 630));
    }
    
    /**
     * Testa obtenção do dia da semana
     */
    public function testGetDayOfWeek() {
        $reflection = new ReflectionClass($this->scheduleService);
        $method = $reflection->getMethod('getDayOfWeek');
        $method->setAccessible(true);
        
        // 2024-12-20 é uma sexta-feira (5)
        $this->assertEquals(5, $method->invoke($this->scheduleService, '2024-12-20'));
        
        // 2024-12-22 é um domingo (0)
        $this->assertEquals(0, $method->invoke($this->scheduleService, '2024-12-22'));
    }
    
    /**
     * Testa validação de horário
     */
    public function testTimeValidation() {
        $reflection = new ReflectionClass($this->scheduleService);
        $method = $reflection->getMethod('isValidTime');
        $method->setAccessible(true);
        
        $this->assertTrue($method->invoke($this->scheduleService, '09:00:00'));
        $this->assertTrue($method->invoke($this->scheduleService, '23:59:59'));
        $this->assertFalse($method->invoke($this->scheduleService, '25:00:00'));
        $this->assertFalse($method->invoke($this->scheduleService, 'invalid-time'));
    }
}
```

### 2. Testes de Integração (JavaScript)

```javascript
/**
 * Testes de integração para ScheduleClient
 */
describe('ScheduleClient Integration Tests', () => {
    let scheduleClient;
    const baseUrl = 'http://localhost/agendapro4';
    
    beforeEach(() => {
        scheduleClient = new ScheduleClient(baseUrl);
    });
    
    describe('getAvailableSlots', () => {
        it('should return available slots for valid parameters', async () => {
            const attendantId = 'test-attendant-id';
            const serviceId = 'test-service-id';
            const date = '2024-12-20';
            
            const result = await scheduleClient.getAvailableSlots(attendantId, serviceId, date);
            
            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('available_slots');
            expect(Array.isArray(result.available_slots)).toBe(true);
        });
        
        it('should throw error for invalid parameters', async () => {
            await expect(
                scheduleClient.getAvailableSlots('', '', '')
            ).rejects.toThrow();
        });
    });
    
    describe('getAvailabilityCalendar', () => {
        it('should return calendar for valid date range', async () => {
            const attendantId = 'test-attendant-id';
            const startDate = '2024-12-01';
            const endDate = '2024-12-31';
            
            const result = await scheduleClient.getAvailabilityCalendar(attendantId, startDate, endDate);
            
            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('calendar');
            expect(typeof result.calendar).toBe('object');
        });
    });
    
    describe('checkSpecificAvailability', () => {
        it('should check availability for specific time', async () => {
            const attendantId = 'test-attendant-id';
            const serviceId = 'test-service-id';
            const date = '2024-12-20';
            const time = '09:00:00';
            
            const result = await scheduleClient.checkSpecificAvailability(attendantId, serviceId, date, time);
            
            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('is_available');
            expect(typeof result.is_available).toBe('boolean');
        });
    });
    
    describe('renderAvailableSlots', () => {
        beforeEach(() => {
            document.body.innerHTML = '<div id="test-container"></div>';
        });
        
        it('should render slots correctly', () => {
            const slots = [
                { start_time: '09:00:00', end_time: '10:00:00', duration_minutes: 60 },
                { start_time: '10:00:00', end_time: '11:00:00', duration_minutes: 60 }
            ];
            
            scheduleClient.renderAvailableSlots(slots, 'test-container');
            
            const container = document.getElementById('test-container');
            const slotButtons = container.querySelectorAll('.time-slot');
            
            expect(slotButtons.length).toBe(2);
            expect(slotButtons[0].textContent).toContain('09:00');
            expect(slotButtons[1].textContent).toContain('10:00');
        });
        
        it('should show no slots message when empty', () => {
            scheduleClient.renderAvailableSlots([], 'test-container');
            
            const container = document.getElementById('test-container');
            expect(container.textContent).toContain('Nenhum horário disponível');
        });
    });
});
```

### 3. Script de Teste Automatizado

```bash
#!/bin/bash
# test_schedule_system.sh

echo "=== Testando Sistema de Horários ==="

# Configurações
BASE_URL="http://localhost/agendapro4"
ATTENDANT_ID="test-attendant-id"
SERVICE_ID="test-service-id"
DATE="2024-12-20"
TIME="09:00:00"

echo "\n1. Testando consulta de horários disponíveis..."
curl -s -X GET "$BASE_URL/webhook/schedule/available-slots?attendant_id=$ATTENDANT_ID&service_id=$SERVICE_ID&date=$DATE" | jq .

echo "\n2. Testando calendário de disponibilidade..."
curl -s -X GET "$BASE_URL/webhook/schedule/calendar?attendant_id=$ATTENDANT_ID&start_date=2024-12-01&end_date=2024-12-31" | jq .

echo "\n3. Testando verificação de disponibilidade específica..."
curl -s -X POST "$BASE_URL/webhook/schedule/check-availability" \
  -H "Content-Type: application/json" \
  -d "{
    \"attendant_id\": \"$ATTENDANT_ID\",
    \"service_id\": \"$SERVICE_ID\",
    \"date\": \"$DATE\",
    \"time\": \"$TIME\"
  }" | jq .

echo "\n4. Testando gerenciamento de horários..."
curl -s -X POST "$BASE_URL/webhook/schedule/manage" \
  -H "Content-Type: application/json" \
  -d "{
    \"attendant_id\": \"$ATTENDANT_ID\",
    \"schedules\": [
      {
        \"day_of_week\": 1,
        \"start_time\": \"08:00:00\",
        \"end_time\": \"17:00:00\"
      }
    ]
  }" | jq .

echo "\n=== Testes Concluídos ==="
```

---

## Deploy e Produção

### 1. Checklist de Deploy

```bash
# Checklist de Deploy - Sistema de Horários

## Pré-Deploy
- [ ] Testes unitários passando
- [ ] Testes de integração validados
- [ ] Banco de dados configurado
- [ ] Variáveis de ambiente definidas
- [ ] Backup do banco realizado
- [ ] Documentação atualizada

## Deploy
- [ ] Aplicar migrações do banco
- [ ] Configurar índices de performance
- [ ] Ativar políticas de segurança (RLS)
- [ ] Validar endpoints da API
- [ ] Testar integração com frontend
- [ ] Verificar logs de erro

## Pós-Deploy
- [ ] Monitorar performance
- [ ] Validar funcionalidades críticas
- [ ] Verificar métricas de uso
- [ ] Documentar problemas encontrados
```

### 2. Configuração de Produção

```bash
# .env.production
SUPABASE_URL=https://seu-projeto-prod.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_prod
SUPABASE_SERVICE_KEY=sua_chave_servico_prod
TIMEZONE=America/Sao_Paulo
DEBUG_MODE=false

# Configurações de performance
CACHE_ENABLED=true
CACHE_TTL=300
MAX_CONCURRENT_REQUESTS=100
REQUEST_TIMEOUT=30

# Configurações de horários
DEFAULT_SLOT_DURATION=60
BUFFER_TIME_MINUTES=15
MAX_ADVANCE_DAYS=90
MIN_ADVANCE_HOURS=2

# Monitoramento
LOG_LEVEL=error
ERROR_REPORTING=true
PERFORMANCE_MONITORING=true
```

### 3. Script de Deploy Automatizado

```bash
#!/bin/bash
# deploy_schedule_system.sh

set -e

echo "=== Deploy do Sistema de Horários ==="

# Configurações
PROJECT_DIR="/var/www/agendapro4"
BACKUP_DIR="/var/backups/agendapro4"
DATE=$(date +"%Y%m%d_%H%M%S")

# 1. Backup
echo "1. Criando backup..."
mkdir -p $BACKUP_DIR
cp -r $PROJECT_DIR $BACKUP_DIR/backup_$DATE

# 2. Atualizar código
echo "2. Atualizando código..."
cd $PROJECT_DIR
git pull origin main

# 3. Instalar dependências
echo "3. Instalando dependências..."
composer install --no-dev --optimize-autoloader

# 4. Aplicar migrações
echo "4. Aplicando migrações..."
php scripts/migrate.php

# 5. Limpar cache
echo "5. Limpando cache..."
php scripts/clear_cache.php

# 6. Validar deploy
echo "6. Validando deploy..."
php scripts/health_check.php

# 7. Reiniciar serviços
echo "7. Reiniciando serviços..."
sudo systemctl reload nginx
sudo systemctl reload php8.1-fpm

echo "=== Deploy Concluído com Sucesso ==="
```

---

## Troubleshooting

### 1. Problemas Comuns

#### Erro: "Nenhum horário disponível"

**Possíveis Causas:**
- Atendente não possui horários configurados
- Todos os horários estão ocupados
- Configuração incorreta de dias da semana
- Serviço com duração muito longa

**Soluções:**
```php
// Debug: Verificar horários do atendente
$schedules = $scheduleService->getAttendantSchedules($attendantId, $dayOfWeek);
var_dump($schedules);

// Debug: Verificar agendamentos existentes
$appointments = $scheduleService->getBookedAppointments($attendantId, $date);
var_dump($appointments);

// Debug: Verificar cálculo de slots
$slots = $scheduleService->calculateAvailableSlots($schedules, $appointments, $duration);
var_dump($slots);
```

#### Erro: "Atendente não encontrado"

**Possíveis Causas:**
- ID do atendente inválido
- Atendente inativo
- Problema de conexão com banco

**Soluções:**
```php
// Verificar se atendente existe e está ativo
$attendant = $scheduleService->getAttendantById($attendantId);
if (!$attendant) {
    error_log("Atendente não encontrado: $attendantId");
}
if (!$attendant['is_active']) {
    error_log("Atendente inativo: $attendantId");
}
```

#### Erro: "Erro na requisição: HTTP 400"

**Possíveis Causas:**
- Parâmetros de consulta inválidos
- Formato de data incorreto
- Chave de API inválida

**Soluções:**
```php
// Validar parâmetros antes da requisição
if (!$this->isValidDate($date)) {
    throw new Exception('Formato de data inválido. Use YYYY-MM-DD');
}

if (!$this->isValidTime($time)) {
    throw new Exception('Formato de horário inválido. Use HH:MM:SS');
}

// Log detalhado de requisições
error_log("Requisição Supabase: $url");
error_log("Parâmetros: " . json_encode($params));
```

### 2. Logs de Debug

```php
/**
 * Sistema de logs para debug
 */
class ScheduleLogger {
    private $logFile;
    private $debugMode;
    
    public function __construct($logFile = 'schedule_debug.log', $debugMode = false) {
        $this->logFile = $logFile;
        $this->debugMode = $debugMode;
    }
    
    public function debug($message, $context = []) {
        if (!$this->debugMode) return;
        
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? json_encode($context) : '';
        $logEntry = "[$timestamp] DEBUG: $message $contextStr\n";
        
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    public function error($message, $context = []) {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? json_encode($context) : '';
        $logEntry = "[$timestamp] ERROR: $message $contextStr\n";
        
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
        error_log($logEntry);
    }
    
    public function info($message, $context = []) {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? json_encode($context) : '';
        $logEntry = "[$timestamp] INFO: $message $contextStr\n";
        
        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
}

// Uso no ScheduleService
class ScheduleService {
    private $logger;
    
    public function __construct($supabaseUrl, $supabaseKey, $debugMode = false) {
        $this->supabaseUrl = $supabaseUrl;
        $this->supabaseKey = $supabaseKey;
        $this->logger = new ScheduleLogger('schedule.log', $debugMode);
    }
    
    public function getAvailableTimeSlots($attendantId, $serviceId, $date) {
        $this->logger->info('Iniciando busca de horários disponíveis', [
            'attendant_id' => $attendantId,
            'service_id' => $serviceId,
            'date' => $date
        ]);
        
        try {
            // ... lógica existente ...
            
            $this->logger->debug('Horários encontrados', [
                'total_slots' => count($availableSlots)
            ]);
            
            return $result;
            
        } catch (Exception $e) {
            $this->logger->error('Erro ao obter horários', [
                'error' => $e->getMessage(),
                'attendant_id' => $attendantId,
                'service_id' => $serviceId,
                'date' => $date
            ]);
            
            throw $e;
        }
    }
}
```

### 3. Monitoramento de Performance

```php
/**
 * Monitor de performance para sistema de horários
 */
class SchedulePerformanceMonitor {
    private $metrics = [];
    
    public function startTimer($operation) {
        $this->metrics[$operation] = [
            'start_time' => microtime(true),
            'memory_start' => memory_get_usage()
        ];
    }
    
    public function endTimer($operation) {
        if (!isset($this->metrics[$operation])) {
            return null;
        }
        
        $endTime = microtime(true);
        $endMemory = memory_get_usage();
        
        $this->metrics[$operation]['end_time'] = $endTime;
        $this->metrics[$operation]['duration'] = $endTime - $this->metrics[$operation]['start_time'];
        $this->metrics[$operation]['memory_used'] = $endMemory - $this->metrics[$operation]['memory_start'];
        
        return $this->metrics[$operation];
    }
    
    public function getMetrics() {
        return $this->metrics;
    }
    
    public function logSlowOperations($threshold = 1.0) {
        foreach ($this->metrics as $operation => $data) {
            if (isset($data['duration']) && $data['duration'] > $threshold) {
                error_log("Operação lenta detectada: $operation - {$data['duration']}s");
            }
        }
    }
}

// Uso no ScheduleService
$monitor = new SchedulePerformanceMonitor();

$monitor->startTimer('get_available_slots');
$result = $scheduleService->getAvailableTimeSlots($attendantId, $serviceId, $date);
$metrics = $monitor->endTimer('get_available_slots');

$monitor->logSlowOperations(0.5); // Log operações > 500ms
```

### 4. Health Check

```php
<?php
/**
 * Health check para sistema de horários
 */
require_once 'config.php';
require_once 'ScheduleService.php';

header('Content-Type: application/json');

try {
    $config = new ConfigManager();
    $scheduleService = new ScheduleService(
        $config->get('SUPABASE_URL'),
        $config->get('SUPABASE_SERVICE_KEY')
    );
    
    $healthChecks = [
        'database_connection' => false,
        'api_endpoints' => false,
        'schedule_service' => false,
        'performance' => false
    ];
    
    // 1. Testar conexão com banco
    try {
        $result = $scheduleService->makeSupabaseRequest('/rest/v1/', 'GET');
        $healthChecks['database_connection'] = true;
    } catch (Exception $e) {
        error_log('Health check - Erro de conexão: ' . $e->getMessage());
    }
    
    // 2. Testar endpoints principais
    try {
        $testDate = date('Y-m-d', strtotime('+1 day'));
        $result = $scheduleService->getAvailableTimeSlots('test-id', 'test-service', $testDate);
        $healthChecks['api_endpoints'] = isset($result['success']);
    } catch (Exception $e) {
        error_log('Health check - Erro de endpoint: ' . $e->getMessage());
    }
    
    // 3. Testar serviço de horários
    try {
        $schedules = $scheduleService->getAttendantSchedules('test-id', 1);
        $healthChecks['schedule_service'] = is_array($schedules);
    } catch (Exception $e) {
        error_log('Health check - Erro de serviço: ' . $e->getMessage());
    }
    
    // 4. Testar performance
    $startTime = microtime(true);
    $scheduleService->getAvailableTimeSlots('test-id', 'test-service', date('Y-m-d'));
    $duration = microtime(true) - $startTime;
    $healthChecks['performance'] = $duration < 2.0; // Menos de 2 segundos
    
    $allHealthy = !in_array(false, $healthChecks);
    
    http_response_code($allHealthy ? 200 : 503);
    
    echo json_encode([
        'status' => $allHealthy ? 'healthy' : 'unhealthy',
        'timestamp' => date('c'),
        'checks' => $healthChecks,
        'performance' => [
            'response_time' => round($duration * 1000, 2) . 'ms'
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(503);
    echo json_encode([
        'status' => 'error',
        'error' => $e->getMessage(),
        'timestamp' => date('c')
    ]);
}
?>
```

---

## Conclusão

Este guia fornece uma implementação completa do sistema de horários baseado no AgendaPro4, incluindo:

✅ **Estrutura de dados** otimizada com índices e políticas de segurança
✅ **Backend robusto** com validações e tratamento de erros
✅ **APIs REST** documentadas e testadas
✅ **Integração frontend** com JavaScript e CSS
✅ **Testes automatizados** para garantir qualidade
✅ **Deploy e monitoramento** para produção
✅ **Troubleshooting** para resolução de problemas

### Próximos Passos

1. **Adaptar configurações** para seu projeto específico
2. **Personalizar validações** conforme regras de negócio
3. **Implementar cache** para melhor performance
4. **Adicionar notificações** para mudanças de horário
5. **Integrar com sistema de pagamentos** se necessário

### Suporte

Para dúvidas ou problemas:
- Consulte a seção de **Troubleshooting**
- Verifique os **logs de debug**
- Execute o **health check**
- Analise as **métricas de performance**

---

*Guia criado com base no sistema AgendaPro4 - Versão 1.0*