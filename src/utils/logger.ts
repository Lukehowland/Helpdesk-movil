import { format } from 'date-fns';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
    context?: string;
}

class Logger {
    private static instance: Logger;
    private isDev: boolean = __DEV__;

    private constructor() { }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(level: LogLevel, message: string, data?: any, context?: string): void {
        const timestamp = format(new Date(), 'HH:mm:ss.SSS');
        const contextTag = context ? `[${context}]` : '';

        let icon = '';
        switch (level) {
            case 'DEBUG': icon = '🐛'; break;
            case 'INFO': icon = 'ℹ️'; break;
            case 'WARN': icon = '⚠️'; break;
            case 'ERROR': icon = '🚨'; break;
        }

        const logHeader = `${icon} ${timestamp} ${level} ${contextTag} ${message}`;

        if (this.isDev) {
            switch (level) {
                case 'DEBUG':
                case 'INFO':
                    console.log(logHeader);
                    if (data) console.log(JSON.stringify(data, null, 2));
                    break;
                case 'WARN':
                    console.warn(logHeader);
                    if (data) console.warn(data);
                    break;
                case 'ERROR':
                    console.error(logHeader);
                    if (data) {
                        console.error(data);
                        if (data instanceof Error && data.stack) {
                            console.error('Stack Trace:', data.stack);
                        }
                    }
                    break;
            }
        }
    }

    public debug(message: string, data?: any, context?: string) {
        this.formatMessage('DEBUG', message, data, context);
    }

    public info(message: string, data?: any, context?: string) {
        this.formatMessage('INFO', message, data, context);
    }

    public warn(message: string, data?: any, context?: string) {
        this.formatMessage('WARN', message, data, context);
    }

    public error(message: string, error?: any, context?: string) {
        this.formatMessage('ERROR', message, error, context);
    }
}

export const logger = Logger.getInstance();
