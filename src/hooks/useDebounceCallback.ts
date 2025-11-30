import { useCallback, useRef } from 'react';

/**
 * Hook profesional para prevenir ejecuciones múltiples de callbacks por doble-click/taps rápidos
 * 
 * Similar a useDebounceNavigation pero para callbacks arbitrarios (acciones locales, API calls, etc.)
 * 
 * @param callback - Función a ejecutar
 * @param delay - Tiempo en ms para bloquear ejecuciones subsecuentes (default: 500ms)
 * @param enableLogging - Habilitar logs de debugging (default: __DEV__)
 * 
 * @example
 * ```tsx
 * const handleSubmit = useDebounceCallback(async (data) => {
 *   await createTicket(data);
 * }, 1000);
 * 
 * <TouchableOpacity onPress={() => handleSubmit(formData)}>
 *   <Text>Crear Ticket</Text>
 * </TouchableOpacity>
 * ```
 */
export const useDebounceCallback = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 500,
    enableLogging: boolean = __DEV__
): T => {
    const lastExecutionTime = useRef<number>(0);
    const isExecuting = useRef<boolean>(false);

    const debouncedCallback = useCallback((...args: Parameters<T>) => {
        const now = Date.now();
        const timeSinceLastExecution = now - lastExecutionTime.current;

        // Bloquear si ya se está ejecutando
        if (isExecuting.current) {
            if (enableLogging) {
                console.log('🚫 [useDebounceCallback] Blocked: Execution in progress');
            }
            return;
        }

        // Bloquear si el tiempo desde la última ejecución es menor al delay
        if (timeSinceLastExecution < delay) {
            if (enableLogging) {
                console.log(`🚫 [useDebounceCallback] Blocked: Too fast (${timeSinceLastExecution}ms < ${delay}ms)`);
            }
            return;
        }

        if (enableLogging) {
            console.log(`✅ [useDebounceCallback] Executed (delay: ${delay}ms)`);
        }

        // Marcar como ejecutando
        lastExecutionTime.current = now;
        isExecuting.current = true;

        // Ejecutar el callback
        const result = callback(...args);

        // Si el callback retorna una Promise, esperar a que se resuelva
        if (result instanceof Promise) {
            result.finally(() => {
                setTimeout(() => {
                    isExecuting.current = false;
                }, delay);
            });
        } else {
            // Liberar el lock después del delay
            setTimeout(() => {
                isExecuting.current = false;
            }, delay);
        }

        return result;
    }, [callback, delay, enableLogging]) as T;

    return debouncedCallback;
};

export default useDebounceCallback;
