/**
 * 日志记录器
 * 提供统一的日志记录、过滤、缓存和导出功能
 */

import type { LogEntry, LogLevel, LogCategory } from '../types/panorama';

/**
 * 日志记录器配置
 */
interface LoggerConfig {
  /** 是否为开发模式 */
  isDevelopment: boolean;
  /** 最小日志级别（低于此级别的日志将被过滤） */
  minLevel: LogLevel;
  /** 最大缓存日志数量 */
  maxCacheSize: number;
  /** 是否启用控制台输出 */
  enableConsole: boolean;
}

/**
 * 日志级别权重（用于过滤）
 */
const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  info: 0,
  warn: 1,
  error: 2,
};

/**
 * 日志记录器类
 */
class Logger {
  private config: LoggerConfig;
  private logCache: LogEntry[] = [];
  private reportCallback: ((logs: LogEntry[]) => void) | null = null;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      isDevelopment: import.meta.env.DEV,
      minLevel: 'info',
      maxCacheSize: 1000,
      enableConsole: import.meta.env.DEV,
      ...config,
    };
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
    // 检查日志级别是否满足最小要求
    if (LOG_LEVEL_WEIGHT[level] < LOG_LEVEL_WEIGHT[this.config.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };

    // 添加到缓存
    this.addToCache(entry);

    // 开发模式下输出到控制台
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }
  }

  /**
   * 添加日志到缓存
   */
  private addToCache(entry: LogEntry): void {
    this.logCache.push(entry);

    // 限制缓存大小
    if (this.logCache.length > this.config.maxCacheSize) {
      this.logCache.shift(); // 移除最旧的日志
    }
  }

  /**
   * 输出日志到控制台
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'info':
        console.log(message, entry.data || '');
        break;
      case 'warn':
        console.warn(message, entry.data || '');
        break;
      case 'error':
        console.error(message, entry.data || '');
        break;
    }
  }

  /**
   * 记录 info 级别日志
   */
  info(category: LogCategory, message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  /**
   * 记录 warn 级别日志
   */
  warn(category: LogCategory, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  /**
   * 记录 error 级别日志
   */
  error(category: LogCategory, message: string, data?: any): void {
    this.log('error', category, message, data);
  }

  /**
   * 记录兼容性检测信息
   */
  logCompatibility(capabilities: any): void {
    this.info('compatibility', '浏览器能力检测完成', capabilities);
  }

  /**
   * 记录渲染器切换
   */
  logRendererSwitch(from: string, to: string, reason: string): void {
    this.info('renderer', `渲染器切换: ${from} -> ${to}`, { reason });
  }

  /**
   * 记录错误
   */
  logError(error: Error, context: string): void {
    this.error('video', `错误: ${context}`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }

  /**
   * 记录性能指标
   */
  logPerformance(metric: string, value: number): void {
    this.info('renderer', `性能指标: ${metric}`, { value, unit: 'ms' });
  }

  /**
   * 获取所有缓存的日志
   */
  getLogs(): LogEntry[] {
    return [...this.logCache];
  }

  /**
   * 获取指定级别的日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logCache.filter((entry) => entry.level === level);
  }

  /**
   * 获取指定分类的日志
   */
  getLogsByCategory(category: LogCategory): LogEntry[] {
    return this.logCache.filter((entry) => entry.category === category);
  }

  /**
   * 导出日志为 JSON 字符串
   */
  exportLogs(): string {
    return JSON.stringify(this.logCache, null, 2);
  }

  /**
   * 导出日志为文本格式
   */
  exportLogsAsText(): string {
    return this.logCache
      .map((entry) => {
        const timestamp = new Date(entry.timestamp).toISOString();
        const dataStr = entry.data ? ` | ${JSON.stringify(entry.data)}` : '';
        return `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}${dataStr}`;
      })
      .join('\n');
  }

  /**
   * 清空日志缓存
   */
  clearLogs(): void {
    this.logCache = [];
  }

  /**
   * 设置日志上报回调函数
   */
  setReportCallback(callback: (logs: LogEntry[]) => void): void {
    this.reportCallback = callback;
  }

  /**
   * 上报日志
   * 调用设置的回调函数将日志发送到服务器
   */
  reportLogs(): void {
    if (this.reportCallback && this.logCache.length > 0) {
      this.reportCallback([...this.logCache]);
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// 创建全局日志记录器实例
const logger = new Logger();

export default logger;
export { Logger };
export type { LoggerConfig };
