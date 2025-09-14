# Guia Completo: Implementação da Seção de Atendentes

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados](#estrutura-de-dados)
3. [Configuração do Banco](#configuração-do-banco)
4. [Implementação Backend](#implementação-backend)
5. [APIs e Endpoints](#apis-e-endpoints)
6. [Integração com Sistema Existente](#integração-com-sistema-existente)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Testes e Validação](#testes-e-validação)

---

## 🎯 Visão Geral

Este guia fornece um passo a passo completo para implementar a funcionalidade de **Atendentes** em qualquer sistema, baseado na arquitetura do AgendaPro4. A implementação inclui:

- ✅ Cadastro completo de atendentes
- ✅ Gestão de horários de trabalho
- ✅ Associação com serviços
- ✅ Verificação de disponibilidade
- ✅ APIs REST completas
- ✅ Integração com sistema de agendamentos

---

## 🗄️ Estrutura de Dados

### 1. Tabela Principal: `attendants`

```sql
CREATE TABLE attendants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    bio TEXT,
    photo_url VARCHAR(500),
    position VARCHAR(100), -- Cargo/Função
    specialties TEXT[], -- Array de especialidades
    is_active BOOLEAN DEFAULT true,
    available BOOLEAN DEFAULT true, -- Disponível para agendamentos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_attendants_active ON attendants(is_active);
CREATE INDEX idx_attendants_available ON attendants(available);
CREATE INDEX idx_attendants_email ON attendants(email);
CREATE INDEX idx_attendants_name ON attendants(name);
```

### 2. Tabela de Horários: `attendant_working_hours`

```sql
CREATE TABLE attendant_working_hours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Domingo, 1=Segunda, ..., 6=Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar horários sobrepostos
    CONSTRAINT unique_attendant_day UNIQUE(attendant_id, day_of_week, start_time)
);

-- Índices
CREATE INDEX idx_working_hours_attendant ON attendant_working_hours(attendant_id);
CREATE INDEX idx_working_hours_day ON attendant_working_hours(day_of_week);
CREATE INDEX idx_working_hours_active ON attendant_working_hours(is_active);
```

### 3. Tabela de Associação com Serviços: `attendant_services`

```sql
CREATE TABLE attendant_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar duplicatas
    CONSTRAINT unique_attendant_service UNIQUE(attendant_id, service_id)
);

-- Índices
CREATE INDEX idx_attendant_services_attendant ON attendant_services(attendant_id);
CREATE INDEX idx_attendant_services_service ON attendant_services(service_id);
```

### 4. Tabela de Serviços (se não existir)

```sql
CREATE TABLE services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_active ON services(is_active);
```

---

## ⚙️ Configuração do Banco

### 1. Script de Criação Completo

```sql
-- ============================================
-- SCRIPT DE CRIAÇÃO - SISTEMA DE ATENDENTES
-- ============================================

-- 1. Criar tabela de atendentes
CREATE TABLE IF NOT EXISTS attendants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    bio TEXT,
    photo_url VARCHAR(500),
    position VARCHAR(100),
    specialties TEXT[],
    is_active BOOLEAN DEFAULT true,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de horários de trabalho
CREATE TABLE IF NOT EXISTS attendant_working_hours (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_attendant_day UNIQUE(attendant_id, day_of_week, start_time)
);

-- 3. Criar tabela de associação com serviços
CREATE TABLE IF NOT EXISTS attendant_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendant_id UUID REFERENCES attendants(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_attendant_service UNIQUE(attendant_id, service_id)
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_attendants_active ON attendants(is_active);
CREATE INDEX IF NOT EXISTS idx_attendants_available ON attendants(available);
CREATE INDEX IF NOT EXISTS idx_attendants_email ON attendants(email);
CREATE INDEX IF NOT EXISTS idx_working_hours_attendant ON attendant_working_hours(attendant_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_day ON attendant_working_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_attendant_services_attendant ON attendant_services(attendant_id);
CREATE INDEX IF NOT EXISTS idx_attendant_services_service ON attendant_services(service_id);

-- 5. Inserir dados de exemplo
INSERT INTO attendants (name, email, phone, position, bio, specialties) VALUES
('Dr. João Silva', 'joao@clinica.com', '(11) 99999-1111', 'Médico Clínico', 'Especialista em clínica geral com 10 anos de experiência', ARRAY['Clínica Geral', 'Cardiologia']),
('Dra. Maria Santos', 'maria@clinica.com', '(11) 99999-2222', 'Dermatologista', 'Especialista em dermatologia e procedimentos estéticos', ARRAY['Dermatologia', 'Estética']),
('Dr. Pedro Costa', 'pedro@clinica.com', '(11) 99999-3333', 'Ortopedista', 'Especialista em ortopedia e traumatologia', ARRAY['Ortopedia', 'Traumatologia']);

COMMIT;
```

### 2. Configuração de Permissões (Supabase)

```sql
-- Políticas de segurança para Supabase
-- (Ajuste conforme suas necessidades de autenticação)

-- Permitir leitura de atendentes ativos
CREATE POLICY "Allow read active attendants" ON attendants
    FOR SELECT USING (is_active = true);

-- Permitir CRUD completo para usuários autenticados
CREATE POLICY "Allow full access for authenticated users" ON attendants
    FOR ALL USING (auth.role() = 'authenticated');

-- Aplicar políticas similares para outras tabelas
CREATE POLICY "Allow read working hours" ON attendant_working_hours
    FOR SELECT USING (true);

CREATE POLICY "Allow read attendant services" ON attendant_services
    FOR SELECT USING (true);
```

---

## 💻 Implementação Backend

### 1. Classe ConfigManager (Base)

```php
<?php
/**
 * Gerenciador de Configurações
 * Responsável pela comunicação com o Supabase
 */
class ConfigManager {
    private $supabaseUrl;
    private $supabaseKey;
    private $supabaseServiceKey;
    
    public function __construct() {
        $this->supabaseUrl = $_ENV['SUPABASE_URL'] ?? '';
        $this->supabaseKey = $_ENV['SUPABASE_ANON_KEY'] ?? '';
        $this->supabaseServiceKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? '';
    }
    
    /**
     * Faz requisições para o Supabase
     */
    public function makeSupabaseRequest($endpoint, $method = 'GET', $data = null, $params = []) {
        $url = rtrim($this->supabaseUrl, '/') . $endpoint;
        
        // Adicionar parâmetros de query
        if (!empty($params)) {
            $queryParams = [];
            foreach ($params as $key => $value) {
                $queryParams[] = $key . '=' . urlencode($value);
            }
            $url .= '?' . implode('&', $queryParams);
        }
        
        $headers = [
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $this->supabaseKey,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ];
        
        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $data ? json_encode($data) : null,
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        
        if ($httpCode >= 400) {
            throw new Exception("Erro na requisição: HTTP $httpCode - $response");
        }
        
        return json_decode($response, true);
    }
}
?>
```

### 2. Classe AttendantManager (Principal)

```php
<?php
require_once 'ConfigManager.php';

/**
 * Gerenciador de Atendentes
 * Classe principal para todas as operações relacionadas aos atendentes
 */
class AttendantManager {
    private $config;
    
    public function __construct() {
        $this->config = new ConfigManager();
    }
    
    /**
     * Lista todos os atendentes
     * 
     * @param bool $activeOnly Filtrar apenas atendentes ativos
     * @param bool $availableOnly Filtrar apenas atendentes disponíveis
     * @return array Lista de atendentes
     */
    public function listAttendants($activeOnly = true, $availableOnly = false) {
        try {
            $params = ['order' => 'name.asc'];
            
            if ($activeOnly) {
                $params['is_active'] = 'eq.true';
            }
            
            if ($availableOnly) {
                $params['available'] = 'eq.true';
            }
            
            $result = $this->config->makeSupabaseRequest(
                '/rest/v1/attendants',
                'GET',
                null,
                $params
            );
            
            return [
                'success' => true,
                'data' => $result
            ];
        } catch (Exception $e) {
            error_log("Erro ao listar atendentes: " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Erro ao listar atendentes: " . $e->getMessage()
            ];
        }
    }
    
    /**
     * Obtém um atendente específico com todos os dados relacionados
     * 
     * @param string $attendantId ID do atendente
     * @return array Dados completos do atendente
     */
    public function getAttendant($attendantId) {
        try {
            // Buscar dados básicos do atendente
            $result = $this->config->makeSupabaseRequest(
                '/rest/v1/attendants',
                'GET',
                null,
                [
                    'select' => '*',
                    'id' => "eq.$attendantId"
                ]
            );
            
            if (empty($result)) {
                return [
                    'success' => false,
                    'message' => "Atendente não encontrado"
                ];
            }
            
            $attendant = $result[0];
            
            // Buscar horários de trabalho
            $workingHours = $this->config->makeSupabaseRequest(
                '/rest/v1/attendant_working_hours',
                'GET',
                null,
                [
                    'select' => '*',
                    'attendant_id' => "eq.$attendantId",
                    'is_active' => 'eq.true',
                    'order' => 'day_of_week.asc,start_time.asc'
                ]
            );
            
            // Buscar serviços associados
            $services = $this->config->makeSupabaseRequest(
                '/rest/v1/attendant_services',
                'GET',
                null,
                [
                    'select' => 'service_id,services(id,name,duration_minutes,price)',
                    'attendant_id' => "eq.$attendantId"
                ]
            );
            
            // Organizar dados
            $attendant['working_hours'] = $workingHours;
            $attendant['services'] = $services;
            $attendant['service_ids'] = array_column($services, 'service_id');
            
            return [
                'success' => true,
                'data' => $attendant
            ];
        } catch (Exception $e) {
            error_log("Erro ao buscar atendente: " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Erro ao buscar atendente: " . $e->getMessage()
            ];
        }
    }
    
    /**
     * Cria um novo atendente
     * 
     * @param array $data Dados do atendente
     * @return array Resultado da operação
     */
    public function createAttendant($data) {
        try {
            // Validar dados obrigatórios
            if (empty($data['name'])) {
                return [
                    'success' => false,
                    'message' => 'Nome é obrigatório'
                ];
            }
            
            // Verificar se email já existe
            if (!empty($data['email'])) {
                $existing = $this->config->makeSupabaseRequest(
                    '/rest/v1/attendants',
                    'GET',
                    null,
                    ['email' => "eq.{$data['email']}"]
                );
                
                if (!empty($existing)) {
                    return [
                        'success' => false,
                        'message' => 'Email já está em uso'
                    ];
                }
            }
            
            // Preparar dados do atendente
            $attendantData = [
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'bio' => $data['bio'] ?? null,
                'photo_url' => $data['photo_url'] ?? null,
                'position' => $data['position'] ?? null,
                'specialties' => $data['specialties'] ?? [],
                'is_active' => $data['is_active'] ?? true,
                'available' => $data['available'] ?? true
            ];
            
            // Inserir atendente
            $result = $this->config->makeSupabaseRequest(
                '/rest/v1/attendants',
                'POST',
                $attendantData
            );
            
            if (empty($result)) {
                throw new Exception('Falha ao criar atendente');
            }
            
            $attendantId = $result[0]['id'];
            
            // Inserir horários de trabalho se fornecidos
            if (isset($data['working_hours']) && is_array($data['working_hours'])) {
                foreach ($data['working_hours'] as $wh) {
                    if (isset($wh['day_of_week'], $wh['start_time'], $wh['end_time'])) {
                        $workingHourData = [
                            'attendant_id' => $attendantId,
                            'day_of_week' => intval($wh['day_of_week']),
                            'start_time' => $wh['start_time'],
                            'end_time' => $wh['end_time'],
                            'is_active' => $wh['is_active'] ?? true
                        ];
                        
                        $this->config->makeSupabaseRequest(
                            '/rest/v1/attendant_working_hours',
                            'POST',
                            $workingHourData
                        );
                    }
                }
            }
            
            // Associar serviços se fornecidos
            if (isset($data['service_ids']) && is_array($data['service_ids'])) {
                foreach ($data['service_ids'] as $serviceId) {
                    $serviceData = [
                        'attendant_id' => $attendantId,
                        'service_id' => $serviceId
                    ];
                    
                    $this->config->makeSupabaseRequest(
                        '/rest/v1/attendant_services',
                        'POST',
                        $serviceData
                    );
                }
            }
            
            return [
                'success' => true,
                'message' => 'Atendente criado com sucesso',
                'data' => ['id' => $attendantId]
            ];
        } catch (Exception $e) {
            error_log("Erro ao criar atendente: " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Erro ao criar atendente: " . $e->getMessage()
            ];
        }
    }
    
    /**
     * Atualiza um atendente existente
     * 
     * @param string $attendantId ID do atendente
     * @param array $data Novos dados do atendente
     * @return array Resultado da operação
     */
    public function updateAttendant($attendantId, $data) {
        try {
            // Verificar se o atendente existe
            $attendant = $this->getAttendant($attendantId);
            if (!$attendant['success']) {
                return $attendant;
            }
            
            // Verificar email único (se alterado)
            if (!empty($data['email']) && $data['email'] !== $attendant['data']['email']) {
                $existing = $this->config->makeSupabaseRequest(
                    '/rest/v1/attendants',
                    'GET',
                    null,
                    ['email' => "eq.{$data['email']}"]
                );
                
                if (!empty($existing)) {
                    return [
                        'success' => false,
                        'message' => 'Email já está em uso'
                    ];
                }
            }
            
            // Preparar dados para atualização
            $updateData = ['updated_at' => date('c')];
            
            $allowedFields = ['name', 'email', 'phone', 'bio', 'photo_url', 'position', 'specialties', 'is_active', 'available'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            // Atualizar atendente
            $this->config->makeSupabaseRequest(
                '/rest/v1/attendants',
                'PATCH',
                $updateData,
                ['id' => "eq.$attendantId"]
            );
            
            // Atualizar horários de trabalho se fornecidos
            if (isset($data['working_hours']) && is_array($data['working_hours'])) {
                // Remover horários existentes
                $this->config->makeSupabaseRequest(
                    '/rest/v1/attendant_working_hours',
                    'DELETE',
                    null,
                    ['attendant_id' => "eq.$attendantId"]
                );
                
                // Inserir novos horários
                foreach ($data['working_hours'] as $wh) {
                    if (isset($wh['day_of_week'], $wh['start_time'], $wh['end_time'])) {
                        $workingHourData = [
                            'attendant_id' => $attendantId,
                            'day_of_week' => intval($wh['day_of_week']),
                            'start_time' => $wh['start_time'],
                            'end_time' => $wh['end_time'],
                            'is_active' => $wh['is_active'] ?? true
                        ];
                        
                        $this->config->makeSupabaseRequest(
                            '/rest/v1/attendant_working_hours',
                            'POST',
                            $workingHourData
                        );
                    }
                }
            }
            
            // Atualizar serviços se fornecidos
            if (isset($data['service_ids']) && is_array($data['service_ids'])) {
                // Remover associações existentes
                $this->config->makeSupabaseRequest(
                    '/rest/v1/attendant_services',
                    'DELETE',
                    null,
                    ['attendant_id' => "eq.$attendantId"]
                );
                
                // Inserir novas associações
                foreach ($data['service_ids'] as $serviceId) {
                    $serviceData = [
                        'attendant_id' => $attendantId,
                        'service_id' => $serviceId
                    ];
                    
                    $this->config->makeSupabaseRequest(
                        '/rest/v1/attendant_services',
                        'POST',
                        $serviceData
                    );
                }
            }
            
            return [
                'success' => true,
                'message' => 'Atendente atualizado com sucesso'
            ];
        } catch (Exception $e) {
            error_log("Erro ao atualizar atendente: " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Erro ao atualizar atendente: " . $e->getMessage()
            ];
        }
    }
    
    /**
     * Remove um atendente (soft delete)
     * 
     * @param string $attendantId ID do atendente
     * @return array Resultado da operação
     */
    public function deleteAttendant($attendantId) {
        try {
            // Verificar se existem agendamentos futuros
            $futureAppointments = $this->config->makeSupabaseRequest(
                '/rest/v1/appointments',
                'GET',
                null,
                [
                    'attendant_id' => "eq.$attendantId",
                    'appointment_date' => "gte." . date('Y-m-d'),
                    'status' => "neq.cancelled"
                ]
            );
            
            if (!empty($futureAppointments)) {
                return [
                    'success' => false,
                    'message' => 'Não é possível remover atendente com agendamentos futuros. Desative-o em vez de removê-lo.'
                ];
            }
            
            // Desativar em vez de deletar
            $result = $this->config->makeSupabaseRequest(
                '/rest/v1/attendants',
                'PATCH',
                [
                    'is_active' => false,
                    'available' => false,
                    'updated_at' => date('c')
                ],
                ['id' => "eq.$attendantId"]
            );
            
            return [
                'success' => true,
                'message' => 'Atendente desativado com sucesso'
            ];
        } catch (Exception $e) {
            error_log("Erro ao remover atendente: " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Erro ao remover atendente: " . $e->getMessage()
            ];
        }
    }
    
    /**
     * Verifica disponibilidade de um atendente
     * 
     * @param string $attendantId ID do atendente
     * @param string $date Data no formato Y-m-d
     * @param string $startTime Horário de início
     * @param string $endTime Horário de fim
     * @return array Resultado da verificação
     */
    public function checkAvailability($attendantId, $date, $startTime, $endTime) {
        try {
            // Verificar se a data é futura
            if ($date < date('Y-m-d')) {
                return [
                    'success' => false,
                    'available' => false,
                    'message' => 'Data deve ser futura'
                ];
            }
            
            // Obter dia da semana (0=domingo, 6=sábado)
            $dayOfWeek = date('w', strtotime($date));
            
            // Verificar se o atendente trabalha neste dia
            $workingHours = $this->config->makeSupabaseRequest(
                '/rest/v1/attendant_working_hours',
                'GET',
                null,
                [
                    'attendant_id' => "eq.$attendantId",
                    'day_of_week' => "eq.$dayOfWeek",
                    'is_active' => 'eq.true'
                ]
            );
            
            if (empty($workingHours)) {
                return [
                    'success' => true,
                    'available' => false,
                    'message' => 'Atendente não trabalha neste dia'
                ];
            }
            
            // Verificar se o horário está dentro do expediente
            $isWithinWorkingHours = false;
            foreach ($workingHours as $wh) {
                if ($startTime >= $wh['start_time'] && $endTime <= $wh['end_time']) {
                    $isWithinWorkingHours = true;
                    break;
                }
            }
            
            if (!$isWithinWorkingHours) {
                return [
                    'success' => true,
                    'available' => false,
                    'message' => 'Horário fora do expediente'
                ];
            }
            
            // Verificar conflitos com agendamentos existentes
            $conflicts = $this->config->makeSupabaseRequest(
                '/rest/v1/appointments',
                'GET',
                null,
                [
                    'attendant_id' => "eq.$attendantId",
                    'appointment_date' => "eq.$date",
                    'status' => "neq.cancelled",
                    'or' => "(start_time.lt.$endTime,end_time.gt.$startTime)"
                ]
            );
            
            if (!empty($conflicts)) {
                return [
                    'success' => true,
                    'available' => false,
                    'message' => 'Horário já ocupado'
                ];
            }
            
            return [
                'success' => true,
                'available' => true,
                'message' => 'Horário disponível'
            ];
        } catch (Exception $e) {
            error_log("Erro ao verificar disponibilidade: " . $e->getMessage());
            return [
                'success' => false,
                'available' => false,
                'message' => "Erro ao verificar disponibilidade: " . $e->getMessage()
            ];
        }
    }
    
    /**
     * Obtém horários disponíveis de um atendente para uma data
     * 
     * @param string $attendantId ID do atendente
     * @param string $date Data no formato Y-m-d
     * @param int $serviceDuration Duração do serviço em minutos
     * @return array Lista de horários disponíveis
     */
    public function getAvailableSlots($attendantId, $date, $serviceDuration = 60) {
        try {
            $dayOfWeek = date('w', strtotime($date));
            
            // Buscar horários de trabalho
            $workingHours = $this->config->makeSupabaseRequest(
                '/rest/v1/attendant_working_hours',
                'GET',
                null,
                [
                    'attendant_id' => "eq.$attendantId",
                    'day_of_week' => "eq.$dayOfWeek",
                    'is_active' => 'eq.true',
                    'order' => 'start_time.asc'
                ]
            );
            
            if (empty($workingHours)) {
                return [
                    'success' => true,
                    'slots' => []
                ];
            }
            
            // Buscar agendamentos existentes
            $appointments = $this->config->makeSupabaseRequest(
                '/rest/v1/appointments',
                'GET',
                null,
                [
                    'attendant_id' => "eq.$attendantId",
                    'appointment_date' => "eq.$date",
                    'status' => "neq.cancelled",
                    'order' => 'start_time.asc'
                ]
            );
            
            $availableSlots = [];
            
            foreach ($workingHours as $wh) {
                $slots = $this->generateTimeSlots(
                    $wh['start_time'],
                    $wh['end_time'],
                    $serviceDuration,
                    $appointments
                );
                
                $availableSlots = array_merge($availableSlots, $slots);
            }
            
            return [
                'success' => true,
                'slots' => $availableSlots
            ];
        } catch (Exception $e) {
            error_log("Erro ao buscar horários disponíveis: " . $e->getMessage());
            return [
                'success' => false,
                'message' => "Erro ao buscar horários disponíveis: " . $e->getMessage()
            ];
        }
    }
    
    /**
     * Gera slots de tempo disponíveis
     * 
     * @param string $startTime Horário de início
     * @param string $endTime Horário de fim
     * @param int $duration Duração em minutos
     * @param array $appointments Agendamentos existentes
     * @return array Lista de slots
     */
    private function generateTimeSlots($startTime, $endTime, $duration, $appointments) {
        $slots = [];
        $current = new DateTime($startTime);
        $end = new DateTime($endTime);
        
        while ($current < $end) {
            $slotStart = $current->format('H:i:s');
            $slotEnd = $current->add(new DateInterval("PT{$duration}M"))->format('H:i:s');
            
            // Verificar se o slot cabe no horário de trabalho
            if ($slotEnd <= $endTime) {
                // Verificar conflitos
                $hasConflict = false;
                foreach ($appointments as $appointment) {
                    if ($slotStart < $appointment['end_time'] && $slotEnd > $appointment['start_time']) {
                        $hasConflict = true;
                        break;
                    }
                }
                
                if (!$hasConflict) {
                    $slots[] = [
                        'start_time' => $slotStart,
                        'end_time' => $slotEnd
                    ];
                }
            }
        }
        
        return $slots;
    }
}
?>
```

---

## 🌐 APIs e Endpoints

### 1. Arquivo de Rotas (api.php)

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Tratar requisições OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'AttendantManager.php';

$attendantManager = new AttendantManager();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Roteamento
try {
    switch ($method) {
        case 'GET':
            if (isset($pathParts[1]) && $pathParts[1] === 'attendants') {
                if (isset($pathParts[2])) {
                    // GET /api/attendants/{id}
                    $result = $attendantManager->getAttendant($pathParts[2]);
                } elseif (isset($_GET['action'])) {
                    switch ($_GET['action']) {
                        case 'availability':
                            // GET /api/attendants?action=availability&attendant_id=X&date=Y&start_time=Z&end_time=W
                            $result = $attendantManager->checkAvailability(
                                $_GET['attendant_id'],
                                $_GET['date'],
                                $_GET['start_time'],
                                $_GET['end_time']
                            );
                            break;
                        case 'slots':
                            // GET /api/attendants?action=slots&attendant_id=X&date=Y&duration=Z
                            $result = $attendantManager->getAvailableSlots(
                                $_GET['attendant_id'],
                                $_GET['date'],
                                $_GET['duration'] ?? 60
                            );
                            break;
                        default:
                            // GET /api/attendants
                            $result = $attendantManager->listAttendants(
                                $_GET['active_only'] ?? true,
                                $_GET['available_only'] ?? false
                            );
                    }
                } else {
                    // GET /api/attendants
                    $result = $attendantManager->listAttendants(
                        $_GET['active_only'] ?? true,
                        $_GET['available_only'] ?? false
                    );
                }
            }
            break;
            
        case 'POST':
            if (isset($pathParts[1]) && $pathParts[1] === 'attendants') {
                // POST /api/attendants
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $attendantManager->createAttendant($data);
            }
            break;
            
        case 'PUT':
            if (isset($pathParts[1]) && $pathParts[1] === 'attendants' && isset($pathParts[2])) {
                // PUT /api/attendants/{id}
                $data = json_decode(file_get_contents('php://input'), true);
                $result = $attendantManager->updateAttendant($pathParts[2], $data);
            }
            break;
            
        case 'DELETE':
            if (isset($pathParts[1]) && $pathParts[1] === 'attendants' && isset($pathParts[2])) {
                // DELETE /api/attendants/{id}
                $result = $attendantManager->deleteAttendant($pathParts[2]);
            }
            break;
            
        default:
            $result = [
                'success' => false,
                'message' => 'Método não permitido'
            ];
            http_response_code(405);
    }
    
    if (!isset($result)) {
        $result = [
            'success' => false,
            'message' => 'Endpoint não encontrado'
        ];
        http_response_code(404);
    }
    
} catch (Exception $e) {
    $result = [
        'success' => false,
        'message' => 'Erro interno do servidor: ' . $e->getMessage()
    ];
    http_response_code(500);
}

echo json_encode($result);
?>
```

### 2. Arquivo .env.example

```env
# Configurações do Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# Configurações da aplicação
APP_ENV=development
APP_DEBUG=true
APP_TIMEZONE=America/Sao_Paulo

# Configurações de logs
LOG_LEVEL=debug
LOG_FILE=logs/app.log
```

---

## 🔗 Integração com Sistema Existente

### 1. Adaptação para Tabela de Pacientes Existente

Se você já possui uma tabela de pacientes, adapte as referências:

```sql
-- Modificar a tabela de agendamentos para usar sua tabela existente
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_patient 
FOREIGN KEY (patient_id) REFERENCES sua_tabela_pacientes(id);

-- Ou se sua tabela tem nome diferente:
-- FOREIGN KEY (patient_id) REFERENCES patients(id);
-- FOREIGN KEY (patient_id) REFERENCES clients(id);
-- etc.
```

### 2. Classe de Integração

```php
<?php
/**
 * Classe para integrar com sistema existente
 */
class SystemIntegration {
    private $attendantManager;
    private $existingPatientTable;
    
    public function __construct($patientTableName = 'patients') {
        $this->attendantManager = new AttendantManager();
        $this->existingPatientTable = $patientTableName;
    }
    
    /**
     * Busca pacientes do sistema existente
     */
    public function getPatients($search = '') {
        $config = new ConfigManager();
        
        $params = ['order' => 'name.asc'];
        if (!empty($search)) {
            $params['or'] = "(name.ilike.*{$search}*,email.ilike.*{$search}*)";
        }
        
        return $config->makeSupabaseRequest(
            "/rest/v1/{$this->existingPatientTable}",
            'GET',
            null,
            $params
        );
    }
    
    /**
     * Cria agendamento integrando atendente e paciente
     */
    public function createAppointment($data) {
        $config = new ConfigManager();
        
        // Validar se paciente existe
        $patient = $config->makeSupabaseRequest(
            "/rest/v1/{$this->existingPatientTable}",
            'GET',
            null,
            ['id' => "eq.{$data['patient_id']}"]
        );
        
        if (empty($patient)) {
            return [
                'success' => false,
                'message' => 'Paciente não encontrado'
            ];
        }
        
        // Verificar disponibilidade do atendente
        $availability = $this->attendantManager->checkAvailability(
            $data['attendant_id'],
            $data['appointment_date'],
            $data['start_time'],
            $data['end_time']
        );
        
        if (!$availability['available']) {
            return [
                'success' => false,
                'message' => $availability['message']
            ];
        }
        
        // Criar agendamento
        $appointmentData = [
            'patient_id' => $data['patient_id'],
            'attendant_id' => $data['attendant_id'],
            'service_id' => $data['service_id'] ?? null,
            'appointment_date' => $data['appointment_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'status' => 'scheduled',
            'notes' => $data['notes'] ?? null
        ];
        
        return $config->makeSupabaseRequest(
            '/rest/v1/appointments',
            'POST',
            $appointmentData
        );
    }
}
?>
```

---

## 📝 Exemplos Práticos

### 1. Exemplo de Uso Completo

```php
<?php
// Exemplo de uso da API de Atendentes

require_once 'AttendantManager.php';

$manager = new AttendantManager();

// 1. CRIAR UM NOVO ATENDENTE
$novoAtendente = [
    'name' => 'Dr. Carlos Oliveira',
    'email' => 'carlos@clinica.com',
    'phone' => '(11) 99999-4444',
    'position' => 'Cardiologista',
    'bio' => 'Especialista em cardiologia com 15 anos de experiência',
    'specialties' => ['Cardiologia', 'Ecocardiograma'],
    'working_hours' => [
        [
            'day_of_week' => 1, // Segunda-feira
            'start_time' => '08:00:00',
            'end_time' => '12:00:00'
        ],
        [
            'day_of_week' => 1, // Segunda-feira (tarde)
            'start_time' => '14:00:00',
            'end_time' => '18:00:00'
        ],
        [
            'day_of_week' => 3, // Quarta-feira
            'start_time' => '08:00:00',
            'end_time' => '12:00:00'
        ]
    ],
    'service_ids' => ['uuid-do-servico-1', 'uuid-do-servico-2']
];

$resultado = $manager->createAttendant($novoAtendente);
if ($resultado['success']) {
    echo "Atendente criado com sucesso! ID: " . $resultado['data']['id'] . "\n";
    $attendantId = $resultado['data']['id'];
} else {
    echo "Erro: " . $resultado['message'] . "\n";
    exit;
}

// 2. LISTAR TODOS OS ATENDENTES
$atendentes = $manager->listAttendants();
if ($atendentes['success']) {
    echo "\nAtendentes encontrados: " . count($atendentes['data']) . "\n";
    foreach ($atendentes['data'] as $atendente) {
        echo "- {$atendente['name']} ({$atendente['position']})\n";
    }
}

// 3. BUSCAR UM ATENDENTE ESPECÍFICO
$atendente = $manager->getAttendant($attendantId);
if ($atendente['success']) {
    echo "\nDados completos do atendente:\n";
    echo "Nome: " . $atendente['data']['name'] . "\n";
    echo "Email: " . $atendente['data']['email'] . "\n";
    echo "Horários de trabalho: " . count($atendente['data']['working_hours']) . "\n";
    echo "Serviços associados: " . count($atendente['data']['services']) . "\n";
}

// 4. VERIFICAR DISPONIBILIDADE
$disponibilidade = $manager->checkAvailability(
    $attendantId,
    '2024-02-15', // Data
    '09:00:00',   // Horário início
    '10:00:00'    // Horário fim
);

if ($disponibilidade['success']) {
    if ($disponibilidade['available']) {
        echo "\nAtendente disponível no horário solicitado!\n";
    } else {
        echo "\nAtendente NÃO disponível: " . $disponibilidade['message'] . "\n";
    }
}

// 5. BUSCAR HORÁRIOS DISPONÍVEIS
$slots = $manager->getAvailableSlots(
    $attendantId,
    '2024-02-15', // Data
    60            // Duração em minutos
);

if ($slots['success']) {
    echo "\nHorários disponíveis em 15/02/2024:\n";
    foreach ($slots['slots'] as $slot) {
        echo "- {$slot['start_time']} às {$slot['end_time']}\n";
    }
}

// 6. ATUALIZAR ATENDENTE
$dadosAtualizacao = [
    'phone' => '(11) 99999-5555',
    'bio' => 'Especialista em cardiologia com 16 anos de experiência',
    'working_hours' => [
        [
            'day_of_week' => 1,
            'start_time' => '08:00:00',
            'end_time' => '17:00:00' // Horário estendido
        ]
    ]
];

$atualizacao = $manager->updateAttendant($attendantId, $dadosAtualizacao);
if ($atualizacao['success']) {
    echo "\nAtendente atualizado com sucesso!\n";
}

// 7. DESATIVAR ATENDENTE (em vez de deletar)
// $manager->deleteAttendant($attendantId);

echo "\nExemplo concluído!\n";
?>
```

### 2. Exemplo de Requisições AJAX (Frontend)

```javascript
// Classe para gerenciar atendentes no frontend
class AttendantAPI {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }
    
    // Listar atendentes
    async listAttendants(activeOnly = true, availableOnly = false) {
        const params = new URLSearchParams({
            active_only: activeOnly,
            available_only: availableOnly
        });
        
        const response = await fetch(`${this.baseUrl}/attendants?${params}`);
        return await response.json();
    }
    
    // Buscar atendente específico
    async getAttendant(id) {
        const response = await fetch(`${this.baseUrl}/attendants/${id}`);
        return await response.json();
    }
    
    // Criar novo atendente
    async createAttendant(data) {
        const response = await fetch(`${this.baseUrl}/attendants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
    
    // Atualizar atendente
    async updateAttendant(id, data) {
        const response = await fetch(`${this.baseUrl}/attendants/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }
    
    // Verificar disponibilidade
    async checkAvailability(attendantId, date, startTime, endTime) {
        const params = new URLSearchParams({
            action: 'availability',
            attendant_id: attendantId,
            date: date,
            start_time: startTime,
            end_time: endTime
        });
        
        const response = await fetch(`${this.baseUrl}/attendants?${params}`);
        return await response.json();
    }
    
    // Buscar horários disponíveis
    async getAvailableSlots(attendantId, date, duration = 60) {
        const params = new URLSearchParams({
            action: 'slots',
            attendant_id: attendantId,
            date: date,
            duration: duration
        });
        
        const response = await fetch(`${this.baseUrl}/attendants?${params}`);
        return await response.json();
    }
}

// Exemplo de uso no frontend
const attendantAPI = new AttendantAPI();

// Carregar lista de atendentes
async function loadAttendants() {
    try {
        const result = await attendantAPI.listAttendants();
        
        if (result.success) {
            const attendantsList = document.getElementById('attendants-list');
            attendantsList.innerHTML = '';
            
            result.data.forEach(attendant => {
                const div = document.createElement('div');
                div.className = 'attendant-card';
                div.innerHTML = `
                    <h3>${attendant.name}</h3>
                    <p>${attendant.position || 'Sem cargo definido'}</p>
                    <p>${attendant.email}</p>
                    <button onclick="editAttendant('${attendant.id}')">Editar</button>
                `;
                attendantsList.appendChild(div);
            });
        } else {
            console.error('Erro ao carregar atendentes:', result.message);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
    }
}

// Criar novo atendente
async function createNewAttendant() {
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        position: document.getElementById('position').value,
        bio: document.getElementById('bio').value,
        working_hours: getWorkingHoursFromForm(),
        service_ids: getSelectedServices()
    };
    
    try {
        const result = await attendantAPI.createAttendant(formData);
        
        if (result.success) {
            alert('Atendente criado com sucesso!');
            loadAttendants(); // Recarregar lista
            clearForm();
        } else {
            alert('Erro: ' + result.message);
        }
    } catch (error) {
        console.error('Erro ao criar atendente:', error);
        alert('Erro na comunicação com o servidor');
    }
}

// Verificar disponibilidade em tempo real
async function checkRealTimeAvailability() {
    const attendantId = document.getElementById('attendant-select').value;
    const date = document.getElementById('date-input').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    
    if (attendantId && date && startTime && endTime) {
        try {
            const result = await attendantAPI.checkAvailability(
                attendantId, date, startTime + ':00', endTime + ':00'
            );
            
            const statusDiv = document.getElementById('availability-status');
            if (result.success) {
                if (result.available) {
                    statusDiv.innerHTML = '<span class="available">✅ Disponível</span>';
                    statusDiv.className = 'status available';
                } else {
                    statusDiv.innerHTML = `<span class="unavailable">❌ ${result.message}</span>`;
                    statusDiv.className = 'status unavailable';
                }
            }
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
        }
    }
}

// Carregar horários disponíveis
async function loadAvailableSlots() {
    const attendantId = document.getElementById('attendant-select').value;
    const date = document.getElementById('date-input').value;
    const duration = 60; // 1 hora
    
    if (attendantId && date) {
        try {
            const result = await attendantAPI.getAvailableSlots(attendantId, date, duration);
            
            if (result.success) {
                const slotsContainer = document.getElementById('available-slots');
                slotsContainer.innerHTML = '';
                
                if (result.slots.length === 0) {
                    slotsContainer.innerHTML = '<p>Nenhum horário disponível nesta data</p>';
                } else {
                    result.slots.forEach(slot => {
                        const button = document.createElement('button');
                        button.className = 'slot-button';
                        button.textContent = `${slot.start_time.substring(0,5)} - ${slot.end_time.substring(0,5)}`;
                        button.onclick = () => selectSlot(slot.start_time, slot.end_time);
                        slotsContainer.appendChild(button);
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao carregar horários:', error);
        }
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    loadAttendants();
    
    // Adicionar listeners para verificação em tempo real
    ['attendant-select', 'date-input', 'start-time', 'end-time'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', checkRealTimeAvailability);
        }
    });
});
```

---

## ✅ Testes e Validação

### 1. Script de Testes PHP

```php
<?php
/**
 * Script de testes para o sistema de atendentes
 */

require_once 'AttendantManager.php';

class AttendantTests {
    private $manager;
    private $testAttendantId;
    
    public function __construct() {
        $this->manager = new AttendantManager();
    }
    
    public function runAllTests() {
        echo "=== INICIANDO TESTES DO SISTEMA DE ATENDENTES ===\n\n";
        
        $this->testCreateAttendant();
        $this->testListAttendants();
        $this->testGetAttendant();
        $this->testUpdateAttendant();
        $this->testAvailabilityCheck();
        $this->testAvailableSlots();
        $this->testDeleteAttendant();
        
        echo "\n=== TODOS OS TESTES CONCLUÍDOS ===\n";
    }
    
    private function testCreateAttendant() {
        echo "1. Testando criação de atendente...\n";
        
        $data = [
            'name' => 'Dr. Teste Silva',
            'email' => 'teste@clinica.com',
            'phone' => '(11) 99999-0000',
            'position' => 'Médico Teste',
            'bio' => 'Atendente criado para testes',
            'specialties' => ['Teste'],
            'working_hours' => [
                [
                    'day_of_week' => 1,
                    'start_time' => '08:00:00',
                    'end_time' => '17:00:00'
                ]
            ],
            'service_ids' => []
        ];
        
        $result = $this->manager->createAttendant($data);
        
        if ($result['success']) {
            $this->testAttendantId = $result['data']['id'];
            echo "✅ Atendente criado com sucesso! ID: {$this->testAttendantId}\n";
        } else {
            echo "❌ Falha ao criar atendente: {$result['message']}\n";
        }
        echo "\n";
    }
    
    private function testListAttendants() {
        echo "2. Testando listagem de atendentes...\n";
        
        $result = $this->manager->listAttendants();
        
        if ($result['success'] && !empty($result['data'])) {
            echo "✅ Listagem funcionando! Encontrados: " . count($result['data']) . " atendentes\n";
        } else {
            echo "❌ Falha na listagem de atendentes\n";
        }
        echo "\n";
    }
    
    private function testGetAttendant() {
        echo "3. Testando busca de atendente específico...\n";
        
        if (!$this->testAttendantId) {
            echo "❌ ID do atendente de teste não disponível\n\n";
            return;
        }
        
        $result = $this->manager->getAttendant($this->testAttendantId);
        
        if ($result['success'] && isset($result['data']['name'])) {
            echo "✅ Busca funcionando! Atendente: {$result['data']['name']}\n";
            echo "   - Horários de trabalho: " . count($result['data']['working_hours']) . "\n";
            echo "   - Serviços associados: " . count($result['data']['services']) . "\n";
        } else {
            echo "❌ Falha ao buscar atendente específico\n";
        }
        echo "\n";
    }
    
    private function testUpdateAttendant() {
        echo "4. Testando atualização de atendente...\n";
        
        if (!$this->testAttendantId) {
            echo "❌ ID do atendente de teste não disponível\n\n";
            return;
        }
        
        $updateData = [
            'phone' => '(11) 99999-1111',
            'bio' => 'Atendente atualizado para testes'
        ];
        
        $result = $this->manager->updateAttendant($this->testAttendantId, $updateData);
        
        if ($result['success']) {
            echo "✅ Atualização funcionando!\n";
        } else {
            echo "❌ Falha na atualização: {$result['message']}\n";
        }
        echo "\n";
    }
    
    private function testAvailabilityCheck() {
        echo "5. Testando verificação de disponibilidade...\n";
        
        if (!$this->testAttendantId) {
            echo "❌ ID do atendente de teste não disponível\n\n";
            return;
        }
        
        // Testar data futura
        $futureDate = date('Y-m-d', strtotime('+7 days'));
        $result = $this->manager->checkAvailability(
            $this->testAttendantId,
            $futureDate,
            '09:00:00',
            '10:00:00'
        );
        
        if ($result['success']) {
            echo "✅ Verificação de disponibilidade funcionando!\n";
            echo "   - Data: $futureDate\n";
            echo "   - Disponível: " . ($result['available'] ? 'Sim' : 'Não') . "\n";
            echo "   - Mensagem: {$result['message']}\n";
        } else {
            echo "❌ Falha na verificação de disponibilidade\n";
        }
        echo "\n";
    }
    
    private function testAvailableSlots() {
        echo "6. Testando busca de horários disponíveis...\n";
        
        if (!$this->testAttendantId) {
            echo "❌ ID do atendente de teste não disponível\n\n";
            return;
        }
        
        $futureDate = date('Y-m-d', strtotime('+7 days'));
        $result = $this->manager->getAvailableSlots($this->testAttendantId, $futureDate, 60);
        
        if ($result['success']) {
            echo "✅ Busca de horários funcionando!\n";
            echo "   - Data: $futureDate\n";
            echo "   - Slots encontrados: " . count($result['slots']) . "\n";
        } else {
            echo "❌ Falha na busca de horários\n";
        }
        echo "\n";
    }
    
    private function testDeleteAttendant() {
        echo "7. Testando remoção de atendente...\n";
        
        if (!$this->testAttendantId) {
            echo "❌ ID do atendente de teste não disponível\n\n";
            return;
        }
        
        $result = $this->manager->deleteAttendant($this->testAttendantId);
        
        if ($result['success']) {
            echo "✅ Remoção funcionando! (Atendente desativado)\n";
        } else {
            echo "❌ Falha na remoção: {$result['message']}\n";
        }
        echo "\n";
    }
}

// Executar testes
if (php_sapi_name() === 'cli') {
    $tests = new AttendantTests();
    $tests->runAllTests();
} else {
    echo "Execute este script via linha de comando: php tests.php";
}
?>
```

### 2. Checklist de Validação

```markdown
## ✅ Checklist de Implementação

### Banco de Dados
- [ ] Tabela `attendants` criada
- [ ] Tabela `attendant_working_hours` criada
- [ ] Tabela `attendant_services` criada
- [ ] Índices criados para performance
- [ ] Políticas de segurança configuradas (se usando Supabase)
- [ ] Dados de exemplo inseridos

### Backend
- [ ] Classe `ConfigManager` implementada
- [ ] Classe `AttendantManager` implementada
- [ ] Arquivo de rotas `api.php` criado
- [ ] Arquivo `.env` configurado
- [ ] Testes executados com sucesso

### APIs
- [ ] GET /api/attendants (listar)
- [ ] GET /api/attendants/{id} (buscar específico)
- [ ] POST /api/attendants (criar)
- [ ] PUT /api/attendants/{id} (atualizar)
- [ ] DELETE /api/attendants/{id} (remover)
- [ ] GET /api/attendants?action=availability (verificar disponibilidade)
- [ ] GET /api/attendants?action=slots (buscar horários)

### Frontend
- [ ] Classe JavaScript `AttendantAPI` implementada
- [ ] Formulário de cadastro funcionando
- [ ] Lista de atendentes carregando
- [ ] Edição de atendentes funcionando
- [ ] Verificação de disponibilidade em tempo real
- [ ] Seleção de horários disponíveis

### Integração
- [ ] Integração com tabela de pacientes existente
- [ ] Criação de agendamentos funcionando
- [ ] Validações de negócio implementadas
```

---

## 🚀 Deploy e Produção

### 1. Configurações de Produção

```env
# .env para produção
SUPABASE_URL=https://seu-projeto-prod.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_producao
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_producao

APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=America/Sao_Paulo

LOG_LEVEL=error
LOG_FILE=logs/app.log
```

### 2. Script de Deploy

```bash
#!/bin/bash
# deploy.sh

echo "Iniciando deploy do sistema de atendentes..."

# 1. Backup do banco (se necessário)
echo "Fazendo backup..."
# pg_dump ou comando equivalente

# 2. Executar migrações
echo "Executando migrações..."
psql -f scripts/create_attendants_tables.sql

# 3. Copiar arquivos
echo "Copiando arquivos..."
cp -r src/* /var/www/html/

# 4. Configurar permissões
echo "Configurando permissões..."
chmod 644 /var/www/html/*.php
chmod 600 /var/www/html/.env

# 5. Reiniciar serviços
echo "Reiniciando serviços..."
sudo systemctl restart apache2
# ou nginx/php-fpm conforme sua configuração

echo "Deploy concluído!"
```

### 3. Monitoramento

```php
<?php
/**
 * Script de monitoramento da saúde do sistema
 */
class HealthCheck {
    public function checkDatabase() {
        try {
            $config = new ConfigManager();
            $result = $config->makeSupabaseRequest('/rest/v1/attendants', 'GET', null, ['limit' => '1']);
            return ['status' => 'ok', 'message' => 'Banco conectado'];
        } catch (Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }
    
    public function checkAPI() {
        $checks = [
            'database' => $this->checkDatabase()
        ];
        
        $allOk = true;
        foreach ($checks as $check) {
            if ($check['status'] !== 'ok') {
                $allOk = false;
                break;
            }
        }
        
        return [
            'status' => $allOk ? 'healthy' : 'unhealthy',
            'checks' => $checks,
            'timestamp' => date('c')
        ];
    }
}

// Endpoint de health check
if ($_SERVER['REQUEST_URI'] === '/health') {
    header('Content-Type: application/json');
    $health = new HealthCheck();
    echo json_encode($health->checkAPI());
    exit;
}
?>
```

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Supabase
```
Erro: "Failed to connect to Supabase"

Solução:
- Verificar se as variáveis SUPABASE_URL e SUPABASE_ANON_KEY estão corretas
- Confirmar se o projeto Supabase está ativo
- Testar conectividade: curl -I https://seu-projeto.supabase.co
```

#### 2. Erro de Permissões
```
Erro: "Permission denied"

Solução:
- Verificar políticas RLS no Supabase
- Confirmar se está usando a chave correta (anon vs service_role)
- Revisar permissões das tabelas
```

#### 3. Horários Não Aparecendo
```
Problema: getAvailableSlots retorna array vazio

Verificações:
1. Atendente tem horários de trabalho cadastrados?
2. Dia da semana está correto? (0=domingo, 6=sábado)
3. Existem agendamentos conflitantes?
4. Atendente está ativo e disponível?
```

#### 4. Erro de Validação de Email
```
Erro: "Email já está em uso"

Solução:
- Verificar se o email realmente existe na base
- Confirmar se não há espaços em branco
- Validar formato do email
```

### Logs e Debug

```php
// Adicionar logs para debug
error_log("Debug: Dados recebidos - " . json_encode($data));
error_log("Debug: Resultado da query - " . json_encode($result));

// Verificar logs
tail -f /var/log/apache2/error.log
# ou
tail -f logs/app.log
```

---

## 📚 Conclusão

Este guia fornece uma implementação completa e funcional do sistema de atendentes, incluindo:

### ✅ **O que foi implementado:**
- **Estrutura de dados** completa com 3 tabelas principais
- **Backend robusto** com classe AttendantManager
- **APIs REST** completas para todas as operações
- **Verificação de disponibilidade** em tempo real
- **Gestão de horários** flexível e intuitiva
- **Integração** com sistemas existentes
- **Testes automatizados** para validação
- **Exemplos práticos** de uso

### 🎯 **Próximos passos:**
1. Executar o script de criação das tabelas
2. Configurar as variáveis de ambiente
3. Implementar as classes PHP
4. Testar as APIs
5. Integrar com o frontend existente
6. Executar os testes de validação
7. Fazer deploy em produção

### 🔧 **Customizações possíveis:**
- Adicionar campos específicos do seu negócio
- Implementar notificações por email/SMS
- Criar relatórios de produtividade
- Integrar com calendários externos
- Adicionar sistema de avaliações

### 📞 **Suporte:**
Em caso de dúvidas ou problemas:
1. Consulte a seção de Troubleshooting
2. Verifique os logs de erro
3. Execute os testes automatizados
4. Revise as configurações do .env

**Sucesso na implementação! 🚀**