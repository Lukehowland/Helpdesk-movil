import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Hook profesional para prevenir navegaciones múltiples por doble-click/taps rápidos
 *
 * @param delay - Tiempo en ms para bloquear navegaciones subsecuentes (default: 500ms)
 * @param enableLogging - Habilitar logs de debugging (default: __DEV__)
 *
 * @example
 * ```tsx
 * const { push, replace, back } = useDebounceNavigation();
 *
 * <TouchableOpacity onPress={() => push('/profile')}>
 *   <Text>Go to Profile</Text>
 * </TouchableOpacity>
 * ```
 */
export const useDebounceNavigation = (
    delay: number = 500,
    enableLogging: boolean = __DEV__
) => {
    const router = useRouter();
    const lastNavigationTime = useRef<number>(0);
    const isNavigating = useRef<boolean>(false);

    /**
     * Verifica si se puede navegar basado en el delay configurado
     */
    const canNavigate = useCallback((): boolean => {
        const now = Date.now();
        const timeSinceLastNav = now - lastNavigationTime.current;

        if (isNavigating.current) {
            if (enableLogging) {
                console.log('🚫 Navigation blocked: Navigation in progress');
            }
            return false;
        }

        if (timeSinceLastNav < delay) {
            if (enableLogging) {
                console.log(`🚫 Navigation blocked: Too fast (${timeSinceLastNav}ms < ${delay}ms)`);
            }
            return false;
        }

        return true;
    }, [delay, enableLogging]);

    /**
     * Actualiza el timestamp y estado de navegación
     */
    const markNavigationStart = useCallback(() => {
        lastNavigationTime.current = Date.now();
        isNavigating.current = true;

        // Liberar el lock después del delay
        setTimeout(() => {
            isNavigating.current = false;
        }, delay);
    }, [delay]);

    /**
     * Push navigation con protección de doble-click
     */
    const push = useCallback((href: string) => {
        if (!canNavigate()) return;

        if (enableLogging) {
            console.log(`✅ Navigation: push("${href}")`);
        }

        markNavigationStart();
        router.push(href as any);
    }, [router, canNavigate, markNavigationStart, enableLogging]);

    /**
     * Replace navigation con protección de doble-click
     */
    const replace = useCallback((href: string) => {
        if (!canNavigate()) return;

        if (enableLogging) {
            console.log(`✅ Navigation: replace("${href}")`);
        }

        markNavigationStart();
        router.replace(href as any);
    }, [router, canNavigate, markNavigationStart, enableLogging]);

    /**
     * Back navigation con protección de doble-click
     */
    const back = useCallback(() => {
        if (!canNavigate()) return;

        if (enableLogging) {
            console.log('✅ Navigation: back()');
        }

        markNavigationStart();
        router.back();
    }, [router, canNavigate, markNavigationStart, enableLogging]);

    /**
     * Dismiss navigation (para modales) con protección de doble-click
     */
    const dismiss = useCallback((count?: number) => {
        if (!canNavigate()) return;

        if (enableLogging) {
            console.log(`✅ Navigation: dismiss(${count ?? 'all'})`);
        }

        markNavigationStart();
        router.dismiss(count);
    }, [router, canNavigate, markNavigationStart, enableLogging]);

    /**
     * Navegar con params (push)
     */
    const navigate = useCallback((href: string, params?: Record<string, any>) => {
        if (!canNavigate()) return;

        const queryString = params
            ? '?' + new URLSearchParams(params as any).toString()
            : '';
        const fullHref = `${href}${queryString}`;

        if (enableLogging) {
            console.log(`✅ Navigation: navigate("${fullHref}")`);
        }

        markNavigationStart();
        router.push(fullHref as any);
    }, [router, canNavigate, markNavigationStart, enableLogging]);

    return {
        push,
        replace,
        back,
        dismiss,
        navigate,
        // Exponer router original para casos especiales
        router,
    };
};

export default useDebounceNavigation;
