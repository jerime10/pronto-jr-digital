/**
 * Utilitário de logging centralizado para debug do sistema de agendamentos
 * Permite rastreamento detalhado de todo o fluxo de dados
 */

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  component: string;
  action: string;
  data?: any;
  error?: any;
  duration?: number;
}

export class DebugLogger {
  private static instance: DebugLogger;
  private logs: LogEntry[] = [];
  private isEnabled: boolean = true;
  private startTimes: Map<string, number> = new Map();

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private constructor() {
    // Limpar logs antigos a cada 5 minutos
    setInterval(() => {
      this.clearOldLogs();
    }, 5 * 60 * 1000);
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 23);
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, component, action, data, error, duration } = entry;
    let logMessage = `[${timestamp}] ${level} [${component}] ${action}`;
    
    if (duration !== undefined) {
      logMessage += ` (${duration}ms)`;
    }
    
    if (data) {
      logMessage += `\n  Data: ${JSON.stringify(data, null, 2)}`;
    }
    
    if (error) {
      logMessage += `\n  Error: ${JSON.stringify(error, null, 2)}`;
    }
    
    return logMessage;
  }

  log(level: LogEntry['level'], component: string, action: string, data?: any, error?: any): void {
    if (!this.isEnabled) return;

    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      component,
      action,
      data,
      error
    };

    this.logs.push(entry);
    
    // Log no console também
    const formattedLog = this.formatLog(entry);
    switch (level) {
      case 'ERROR':
        console.error(formattedLog);
        break;
      case 'WARN':
        console.warn(formattedLog);
        break;
      case 'DEBUG':
        console.debug(formattedLog);
        break;
      default:
        console.log(formattedLog);
    }
  }

  info(component: string, action: string, data?: any): void {
    this.log('INFO', component, action, data);
  }

  warn(component: string, action: string, data?: any): void {
    this.log('WARN', component, action, data);
  }

  error(component: string, action: string, error: any, data?: any): void {
    this.log('ERROR', component, action, data, error);
  }

  debug(component: string, action: string, data?: any): void {
    this.log('DEBUG', component, action, data);
  }

  // Métodos para medir tempo de execução
  startTimer(timerName: string): void {
    this.startTimes.set(timerName, Date.now());
  }

  endTimer(component: string, action: string, timerName: string, data?: any): void {
    const startTime = this.startTimes.get(timerName);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.startTimes.delete(timerName);
      
      const entry: LogEntry = {
        timestamp: this.getTimestamp(),
        level: 'INFO',
        component,
        action,
        data,
        duration
      };
      
      this.logs.push(entry);
      console.log(this.formatLog(entry));
    }
  }

  // Métodos para gerenciar logs
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByComponent(component: string): LogEntry[] {
    return this.logs.filter(log => log.component === component);
  }

  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getRecentLogs(minutes: number = 5): LogEntry[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.logs.filter(log => new Date(log.timestamp) > cutoff);
  }

  clearLogs(): void {
    this.logs = [];
    this.startTimes.clear();
  }

  private clearOldLogs(): void {
    const cutoff = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos
    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoff);
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  // Método para exportar logs como texto
  exportLogs(): string {
    return this.logs.map(log => this.formatLog(log)).join('\n\n');
  }

  // Método para gerar relatório de performance
  getPerformanceReport(): string {
    const timedLogs = this.logs.filter(log => log.duration !== undefined);
    if (timedLogs.length === 0) {
      return 'Nenhum log com medição de tempo encontrado.';
    }

    const report = timedLogs.map(log => 
      `${log.component}.${log.action}: ${log.duration}ms`
    ).join('\n');

    return `Relatório de Performance:\n${report}`;
  }
}

// Instância singleton para uso global
export const debugLogger = DebugLogger.getInstance();

// Funções de conveniência para uso direto
export const logInfo = (component: string, action: string, data?: any) => 
  debugLogger.info(component, action, data);

export const logWarn = (component: string, action: string, data?: any) => 
  debugLogger.warn(component, action, data);

export const logError = (component: string, action: string, error: any, data?: any) => 
  debugLogger.error(component, action, error, data);

export const logDebug = (component: string, action: string, data?: any) => 
  debugLogger.debug(component, action, data);

export const startTimer = (timerName: string) => 
  debugLogger.startTimer(timerName);

export const endTimer = (component: string, action: string, timerName: string, data?: any) => 
  debugLogger.endTimer(component, action, timerName, data);