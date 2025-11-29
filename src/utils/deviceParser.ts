/**
 * Parses User Agent string to detect device type and browser
 */

export interface DeviceInfo {
    type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    browser: string;
    os: string;
    displayName: string;
    icon: string;
}

export function parseUserAgent(userAgent: string | null, deviceName: string | null): DeviceInfo {
    if (!userAgent) {
        return getDefaultDeviceInfo(deviceName);
    }

    const ua = userAgent.toLowerCase();
    let type: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown';
    let browser = 'Navegador Desconocido';
    let os = 'SO Desconocido';
    let icon = 'devices';

    // Detect OS
    if (ua.includes('windows')) {
        os = 'Windows';
        icon = 'microsoft-windows';
    } else if (ua.includes('mac')) {
        os = 'macOS';
        icon = 'apple';
    } else if (ua.includes('linux')) {
        os = 'Linux';
        icon = 'linux';
    } else if (ua.includes('android')) {
        os = 'Android';
        icon = 'android';
        type = 'mobile';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
        os = 'iOS';
        icon = 'apple';
        type = ua.includes('iphone') ? 'mobile' : 'tablet';
    }

    // Detect Browser
    if (ua.includes('chrome')) {
        browser = 'Chrome';
        icon = 'google-chrome';
    } else if (ua.includes('firefox')) {
        browser = 'Firefox';
        icon = 'firefox';
    } else if (ua.includes('safari')) {
        browser = 'Safari';
        icon = 'apple-safari';
    } else if (ua.includes('edge')) {
        browser = 'Edge';
        icon = 'microsoft-edge';
    } else if (ua.includes('okhttp')) {
        browser = 'Aplicación Móvil';
        type = 'mobile';
        icon = 'android';
    }

    // Detect Device Type if not set
    if (type === 'unknown') {
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            type = 'mobile';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
            type = 'tablet';
        } else {
            type = 'desktop';
        }
    }

    // Get device icon based on device name
    if (deviceName) {
        const name = deviceName.toLowerCase();
        if (name.includes('iphone')) {
            icon = 'apple';
            type = 'mobile';
        } else if (name.includes('ipad')) {
            icon = 'apple';
            type = 'tablet';
        } else if (name.includes('redmi') || name.includes('samsung') || name.includes('pixel')) {
            icon = 'android';
            type = 'mobile';
        }
    }

    const displayName = deviceName || `${browser} en ${os}`;

    return {
        type,
        browser,
        os,
        displayName,
        icon,
    };
}

export function getDefaultDeviceInfo(deviceName: string | null): DeviceInfo {
    const displayName = deviceName || 'Dispositivo Desconocido';
    const isAndroid = deviceName?.toLowerCase().includes('android') || deviceName?.toLowerCase().includes('redmi');
    const isIOS = deviceName?.toLowerCase().includes('iphone') || deviceName?.toLowerCase().includes('ipad');

    return {
        type: isAndroid || isIOS ? 'mobile' : 'unknown',
        browser: 'Navegador Desconocido',
        os: isAndroid ? 'Android' : isIOS ? 'iOS' : 'SO Desconocido',
        displayName,
        icon: isAndroid ? 'android' : isIOS ? 'apple' : 'devices',
    };
}

/**
 * Format location from GeoIP data
 */
export function formatLocation(location: any): string {
    if (!location) return 'Ubicación desconocida';

    const { city, country, country_code } = location;

    if (city && country) {
        return `${city}, ${country}`;
    } else if (country) {
        return country;
    } else if (country_code) {
        return country_code;
    }

    return 'Ubicación desconocida';
}

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode: string | null): string {
    if (!countryCode || countryCode.length !== 2) return '🌍';

    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
}
