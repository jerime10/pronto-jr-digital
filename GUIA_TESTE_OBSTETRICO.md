# 🔍 GUIA DE TESTE - CAMPOS OBSTÉTRICOS

## Como testar se os campos obstétricos estão funcionando:

### 1. Abrir o Console do Navegador
- Pressione F12 ou Ctrl+Shift+I
- Vá para a aba "Console"

### 2. Acessar a Aplicação
- Acesse: http://localhost:8081
- Siga o fluxo de agendamento

### 3. Serviços Obstétricos Disponíveis no Banco:
✅ **CONSULTA ENFERMAGEM + USG POCUS OBSTÉTRICA 1º TRI**
✅ **CONSULTA ENFERMAGEM + USG POCUS OBSTÉTRICA 2º E 3º TRI**  
✅ **TESTE OBSTETRICIA** (criado para teste)

### 4. O que Observar no Console:
Quando você selecionar um serviço obstétrico, deve aparecer:

```
🔍 [DEBUG] Serviço selecionado: CONSULTA ENFERMAGEM + USG POCUS OBSTÉTRICA 1º TRI
🔍 [DEBUG] useEffect service_name mudou: CONSULTA ENFERMAGEM + USG POCUS OBSTÉTRICA 1º TRI
🔍 [DEBUG] isObstetricService chamada com: CONSULTA ENFERMAGEM + USG POCUS OBSTÉTRICA 1º TRI
🔍 [DEBUG] Resultado da validação: true
🔍 [DEBUG] Termos verificados: [array com termos]
🔍 [DEBUG] Serviço É obstétrico!
🔍 [DEBUG] Renderização - service_name: CONSULTA ENFERMAGEM + USG POCUS OBSTÉTRICA 1º TRI, isObstetric: true
```

### 5. O que Deve Aparecer na Tela:
- Seção rosa com título "🤱 Informações Obstétricas"
- Campo "Data da Última Menstruação (DUM)"
- Texto explicativo sobre a importância da DUM

### 6. Se NÃO Funcionar:
- Verifique se os logs aparecem no console
- Se os logs mostram `isObstetric: true` mas os campos não aparecem, há um problema de renderização
- Se os logs mostram `isObstetric: false`, há um problema na função de validação

### 7. Limpeza Após Teste:
Após confirmar que funciona, remover os logs temporários do código.