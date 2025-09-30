import { Injectable } from '@nestjs/common';

@Injectable()
export class DeviceTitleService {
  /**
   * Генерирует название устройства на основе User-Agent строки
   * @param userAgent - User-Agent строка из HTTP заголовка
   * @returns Название устройства (например "Chrome Windows", "Firefox Mac")
   */
  generateDeviceTitle(userAgent: string): string {
    // Простая логика определения типа браузера и ОС
    if (userAgent.includes('Chrome')) {
      if (userAgent.includes('Windows')) return 'Chrome Windows';
      if (userAgent.includes('Mac')) return 'Chrome Mac';
      if (userAgent.includes('Linux')) return 'Chrome Linux';
      return 'Chrome';
    }
    if (userAgent.includes('Firefox')) {
      if (userAgent.includes('Windows')) return 'Firefox Windows';
      if (userAgent.includes('Mac')) return 'Firefox Mac';
      if (userAgent.includes('Linux')) return 'Firefox Linux';
      return 'Firefox';
    }
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'Safari';
    }
    if (userAgent.includes('Edge')) {
      return 'Edge';
    }
    return 'Unknown Browser';
  }
}
