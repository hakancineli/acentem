// Türkiye Cumhuriyet Merkez Bankası döviz kurları API'si
const TCMB_API_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';

export interface CurrencyRate {
  code: string;
  name: string;
  buying: number;
  selling: number;
  lastUpdate: Date;
}

export interface CurrencyRates {
  USD: CurrencyRate;
  EUR: CurrencyRate;
  TRY: CurrencyRate;
}

// Cache için
let cachedRates: CurrencyRates | null = null;
let lastFetch: Date | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 dakika

export async function getCurrencyRates(): Promise<CurrencyRates> {
  // Cache kontrolü
  if (cachedRates && lastFetch && Date.now() - lastFetch.getTime() < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    // TCMB XML'den veri çek
    const response = await fetch(TCMB_API_URL);
    const xmlText = await response.text();
    
    // XML parse et (basit regex ile)
    const usdMatch = xmlText.match(/<Currency[^>]*CurrencyCode="USD"[^>]*>[\s\S]*?<ForexBuying>([\d.]+)<\/ForexBuying>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/);
    const eurMatch = xmlText.match(/<Currency[^>]*CurrencyCode="EUR"[^>]*>[\s\S]*?<ForexBuying>([\d.]+)<\/ForexBuying>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/);

    const rates: CurrencyRates = {
      TRY: {
        code: 'TRY',
        name: 'Türk Lirası',
        buying: 1,
        selling: 1,
        lastUpdate: new Date()
      },
      USD: {
        code: 'USD',
        name: 'Amerikan Doları',
        buying: usdMatch ? parseFloat(usdMatch[1]) : 34.50, // fallback
        selling: usdMatch ? parseFloat(usdMatch[2]) : 34.60,
        lastUpdate: new Date()
      },
      EUR: {
        code: 'EUR',
        name: 'Euro',
        buying: eurMatch ? parseFloat(eurMatch[1]) : 37.20, // fallback
        selling: eurMatch ? parseFloat(eurMatch[2]) : 37.35,
        lastUpdate: new Date()
      }
    };

    cachedRates = rates;
    lastFetch = new Date();
    
    return rates;
  } catch (error) {
    console.error('TCMB API error:', error);
    
    // Hata durumunda fallback değerler
    const fallbackRates: CurrencyRates = {
      TRY: {
        code: 'TRY',
        name: 'Türk Lirası',
        buying: 1,
        selling: 1,
        lastUpdate: new Date()
      },
      USD: {
        code: 'USD',
        name: 'Amerikan Doları',
        buying: 34.50,
        selling: 34.60,
        lastUpdate: new Date()
      },
      EUR: {
        code: 'EUR',
        name: 'Euro',
        buying: 37.20,
        selling: 37.35,
        lastUpdate: new Date()
      }
    };

    cachedRates = fallbackRates;
    lastFetch = new Date();
    
    return fallbackRates;
  }
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string, rates: CurrencyRates): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Önce TRY'ye çevir
  let amountInTRY = amount;
  if (fromCurrency !== 'TRY') {
    const fromRate = rates[fromCurrency as keyof CurrencyRates];
    amountInTRY = amount * fromRate.selling;
  }
  
  // TRY'den hedef para birimine çevir
  if (toCurrency === 'TRY') {
    return amountInTRY;
  }
  
  const toRate = rates[toCurrency as keyof CurrencyRates];
  return amountInTRY / toRate.buying;
}

export function formatCurrency(amount: number, currency: string): string {
  const symbols = {
    TRY: '₺',
    USD: '$',
    EUR: '€'
  };
  
  const symbol = symbols[currency as keyof typeof symbols] || currency;
  return `${symbol}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function getExchangeRateAPI() {
  try {
    const rates = await getCurrencyRates();
    return {
      success: true,
      rates,
      lastUpdate: rates.USD.lastUpdate
    };
  } catch (error) {
    return {
      success: false,
      error: 'Döviz kurları alınamadı',
      rates: null
    };
  }
}