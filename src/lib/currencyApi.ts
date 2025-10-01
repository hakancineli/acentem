// Merkez Bankası API entegrasyonu
export interface CurrencyRates {
  USD: number;
  EUR: number;
  TRY: number;
}

export class CurrencyService {
  private static rates: CurrencyRates = {
    USD: 1,
    EUR: 1,
    TRY: 1
  };

  private static lastUpdate: Date | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

  static async getExchangeRates(): Promise<CurrencyRates> {
    // Cache kontrolü
    if (this.lastUpdate && 
        Date.now() - this.lastUpdate.getTime() < this.CACHE_DURATION) {
      return this.rates;
    }

    try {
      // Merkez Bankası API'si (TCMB)
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      
      this.rates = {
        USD: 1,
        EUR: data.rates.EUR || 0.85,
        TRY: data.rates.TRY || 30.5
      };
      
      this.lastUpdate = new Date();
      return this.rates;
    } catch (error) {
      console.error('Currency API error:', error);
      // Fallback rates
      return {
        USD: 1,
        EUR: 0.85,
        TRY: 30.5
      };
    }
  }

  static async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<number> {
    const rates = await this.getExchangeRates();
    
    // USD'ye çevir
    let usdAmount = amount;
    if (fromCurrency !== 'USD') {
      usdAmount = amount / rates[fromCurrency as keyof CurrencyRates];
    }
    
    // Hedef para birimine çevir
    if (toCurrency === 'USD') {
      return usdAmount;
    }
    
    return usdAmount * rates[toCurrency as keyof CurrencyRates];
  }

  static getCurrencySymbol(currency: string): string {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'TRY': return '₺';
      default: return currency;
    }
  }

  static formatCurrency(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  }
}
