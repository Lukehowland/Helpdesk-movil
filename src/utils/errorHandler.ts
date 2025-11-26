import { logger } from './logger';

export const initGlobalErrorHandler = () => {
    // Catch unhandled JS exceptions
    const defaultHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        logger.error('Unhandled Global Exception', error, 'GlobalErrorHandler');

        if (isFatal) {
            // Allow the default handler to process fatal errors (crash the app gracefully if needed)
            defaultHandler(error, isFatal);
        }
    });

    // Catch unhandled Promise rejections
    // Note: React Native's support for this varies by version/engine (Hermes vs JSC)
    // This is a common pattern for newer RN versions
    const globalAny: any = global;

    const originalHandler = globalAny.onunhandledrejection;
    globalAny.onunhandledrejection = (event: any) => {
        logger.error('Unhandled Promise Rejection', event.reason || event, 'GlobalErrorHandler');
        if (originalHandler) {
            originalHandler(event);
        }
    };

    logger.info('Global Error Handler Initialized', null, 'System');
};
