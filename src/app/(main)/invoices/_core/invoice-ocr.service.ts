'use client'

import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker de PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

// Configurar Tesseract
const tesseractOptions = {
  workerPath: '/tesseract/worker.min.js',
  langPath: '/tesseract/lang-data',
  corePath: '/tesseract/tesseract-core.wasm.js',
};

export interface ExtractedInvoiceData {
  companyName?: string;
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  totalAmount?: number;
  netAmount?: number;
  vatAmount?: number;
  vatRate?: number;
  description?: string;
  confidence: number; // 0-1 score de confianza
}

export class InvoiceOCRService {
  
  /**
   * Extrae datos de una factura desde un archivo (PDF o imagen)
   */
  static async extractInvoiceData(file: File): Promise<ExtractedInvoiceData> {
    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        extractedText = await this.extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        extractedText = await this.extractTextFromImage(file);
      } else {
        throw new Error('Tipo de archivo no soportado para OCR');
      }

      // Parsear el texto extraído para obtener datos estructurados
      const invoiceData = this.parseInvoiceText(extractedText);
      
      return invoiceData;
    } catch (error) {
      console.error('Error en OCR:', error);
      return {
        confidence: 0,
      };
    }
  }

  /**
   * Extrae texto de un PDF usando PDF.js
   */
  private static async extractTextFromPDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async (event) => {
        try {
          const typedArray = new Uint8Array(event.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          
          let fullText = '';
          
          // Extraer texto de todas las páginas
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n';
          }
          
          resolve(fullText);
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extrae texto de una imagen usando Tesseract OCR
   */
  private static async extractTextFromImage(file: File): Promise<string> {
    const result = await Tesseract.recognize(file, 'spa+eng', {
      logger: (m) => console.log('OCR Progress:', m),
      ...tesseractOptions,
    });
    
    return result.data.text;
  }

  /**
   * 🎯 PARSEO MEJORADO - Parsea el texto extraído para identificar datos de la factura
   */
  private static parseInvoiceText(text: string): ExtractedInvoiceData {
    let confidence = 0.3; // Confianza base
    const result: ExtractedInvoiceData = { confidence };

    // 🎯 EXTRACCIÓN MEJORADA
    const companyName = this.extractCompanyName(text);
    if (companyName && this.isLikelyCompanyName(companyName)) {
      result.companyName = companyName;
      confidence += 0.25;
    }

    const invoiceNumber = this.extractInvoiceNumber(text);
    if (invoiceNumber && this.isLikelyInvoiceNumber(invoiceNumber)) {
      result.invoiceNumber = invoiceNumber;
      confidence += 0.25;
    }

    // Extraer fechas
    const dates = this.extractDates(text);
    if (dates.length > 0) {
      result.issueDate = dates[0];
      confidence += 0.15;
      if (dates.length > 1) {
        result.dueDate = dates[1];
        confidence += 0.1;
      }
    }

    // Extraer montos
    const amounts = this.extractAmounts(text);
    if (amounts.total) {
      result.totalAmount = amounts.total;
      confidence += 0.15;
      
      if (amounts.net && amounts.vat && amounts.vatRate) {
        result.netAmount = amounts.net;
        result.vatAmount = amounts.vat;
        result.vatRate = amounts.vatRate;
        confidence += 0.2;
      }
    }

    // Extraer descripción
    const description = this.extractDescription(text);
    if (description) {
      result.description = description;
      confidence += 0.1;
    }

    result.confidence = Math.min(confidence, 1);
    return result;
  }

  /**
   * 🎯 EXTRACCIÓN MEJORADA DE NOMBRES DE EMPRESA
   */
  private static extractCompanyName(text: string): string | null {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Patrones específicos para empresas españolas
    const companyPatterns = [
      // Formas societarias completas
      /([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s\.,-]{2,50}(?:\s+S\.?L\.?(?:\s+U\.?)?|S\.?A\.?|S\.?C\.?P\.?|C\.?B\.?|A\.?I\.?E\.?))/g,
      
      // Empresas con palabras clave del sector
      /([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s\.,-]*(?:Climatización|Refrigeración|HVAC|Aire|Frío|Calor|Energía|Instalaciones|Mantenimiento|Reparaciones|Servicios|Técnica|Ingeniería)[A-Za-záéíóúñ\s\.,-]*)/gi,
      
      // Patrones que incluyen CIF/NIF
      /([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s\.,-]{5,40})\s+(?:CIF|NIF)[\s\.:]*[A-Z]\d{8}[A-Z0-9]/gi,
      
      // Empresas en las primeras líneas (probable emisor)
      /^([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s\.,-]{5,50})$/m,
      
      // Después de "FACTURA DE:" o similar
      /(?:factura\s+de|emisor|empresa)[\s\.:]*([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ\s\.,-]{5,40})/gi,
    ];

    const candidates: Array<{name: string, score: number}> = [];
    const topLines = lines.slice(0, 10).join('\n');
    
    for (const pattern of companyPatterns) {
      const matches = topLines.match(pattern);
      if (matches) {
        for (const match of matches) {
          const cleaned = this.cleanCompanyName(match);
          if (cleaned.length >= 5 && cleaned.length <= 60) {
            let score = 1;
            
            // Puntuación adicional
            if (/S\.?L\.?|S\.?A\.?|C\.?B\.?/.test(cleaned)) score += 3;
            if (/^[A-ZÁÉÍÓÚÑ]/.test(cleaned)) score += 2;
            if (lines.indexOf(lines.find(l => l.includes(cleaned)) || '') < 5) score += 2;
            if (!/\d{8,}/.test(cleaned)) score += 1;
            if (!/€|\d+[,\.]\d{2}/.test(cleaned)) score += 1;
            
            // Bonus por sector
            if (/(climatización|refrigeración|hvac|aire|instalaciones)/i.test(cleaned)) score += 2;
            
            candidates.push({ name: cleaned, score });
          }
        }
      }
    }

    if (candidates.length > 0) {
      return candidates.sort((a, b) => b.score - a.score)[0].name;
    }

    return null;
  }

  /**
   * 🎯 EXTRACCIÓN MEJORADA DE NÚMEROS DE FACTURA
   */
  private static extractInvoiceNumber(text: string): string | null {
    const invoicePatterns = [
      // Formatos estándar españoles
      /(?:factura|invoice|nº|núm\.?|n\.?)[\s\.:]*([A-Z]{0,4}[-\/]?\d{1,4}[-\/]?\d{4})/gi,
      
      // Formatos con prefijos comunes
      /(?:FAC|INV|FC|F)[-\s]?(\d{4}[-\/]?\d{1,4})/gi,
      /(?:FAC|INV|FC|F)[-\s]?(\d{1,4}[-\/]?\d{4})/gi,
      
      // Formatos numéricos simples
      /(?:factura|invoice|nº|núm)[\s\.:]*(\d{6,12})/gi,
      
      // Formatos con año
      /(\d{4}[-\/]\d{1,4})/g,
      /([A-Z]{1,3}\d{4}[-\/]?\d{1,4})/g,
      
      // Después de "Nº" o similar
      /(?:nº|núm\.?|number)[\s\.:]*([A-Z0-9\-\/]{4,15})/gi,
      
      // Patrones en mayúsculas
      /\b([A-Z]{2,4}[-\s]?\d{3,8})\b/g,
    ];

    const candidates: Array<{number: string, score: number}> = [];

    for (const pattern of invoicePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const numberPart = match.replace(/^(factura|invoice|nº|núm\.?|n\.?|fac|inv|fc|f|number)[\s\.:]*[-]?/i, '').trim();
          
          if (numberPart.length >= 3 && numberPart.length <= 20) {
            let score = 1;
            
            // Puntuación por características
            if (/\d{4}/.test(numberPart)) score += 3; // Contiene año
            if (/^[A-Z]{1,4}/.test(numberPart)) score += 2; // Empieza con letras
            if (/[-\/]/.test(numberPart)) score += 2; // Separadores
            if (/^\d+$/.test(numberPart) && numberPart.length >= 4) score += 1; // Solo números
            if (match.toLowerCase().includes('factura') || match.toLowerCase().includes('nº')) score += 2;
            
            // Penalizaciones
            if (/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/.test(numberPart)) score -= 3; // Formato fecha
            if (/€|[,\.]\d{2}$/.test(numberPart)) score -= 3; // Símbolos monetarios
            
            // Contexto
            score += this.analyzeContext(text, numberPart);
            
            candidates.push({ number: numberPart.toUpperCase(), score });
          }
        }
      }
    }

    if (candidates.length > 0) {
      const best = candidates.sort((a, b) => b.score - a.score)[0];
      return best.score > 0 ? best.number : null;
    }

    return null;
  }

  /**
   * Extrae fechas del texto
   */
  private static extractDates(text: string): string[] {
    const datePatterns = [
      /(?:fecha|date)[\s\.:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g,
    ];

    const dates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    }

    return dates
      .map(dateStr => this.parseSpanishDate(dateStr))
      .filter(date => date !== null)
      .sort() as string[];
  }

  /**
   * Extrae montos del texto
   */
  private static extractAmounts(text: string): {total?: number, net?: number, vat?: number, vatRate?: number} {
    const amountPatterns = [
      /(?:total|importe)[\s\.:]*€?\s*(\d+[,\.]\d{2})/gi,
      /(?:base|neto)[\s\.:]*€?\s*(\d+[,\.]\d{2})/gi,
      /(?:iva|vat)[\s\.:]*€?\s*(\d+[,\.]\d{2})/gi,
      /€\s*(\d+[,\.]\d{2})/g,
      /(\d+[,\.]\d{2})\s*€/g,
    ];

    const amounts: number[] = [];
    for (const pattern of amountPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        amounts.push(...matches.map(m => this.parseSpanishNumber(m)));
      }
    }

    const validAmounts = amounts.filter(a => a > 0).sort((a, b) => b - a);
    
    if (validAmounts.length === 0) return {};

    const result: {total?: number, net?: number, vat?: number, vatRate?: number} = {
      total: validAmounts[0]
    };

    // Intentar identificar base e IVA
    if (validAmounts.length >= 2) {
      const possibleVatRates = [0.21, 0.10, 0.04];
      let bestMatch = null;
      let bestDiff = Infinity;
      
      for (let i = 1; i < validAmounts.length; i++) {
        const net = validAmounts[i];
        const vat = validAmounts[0] - net;
        
        for (const rate of possibleVatRates) {
          const expectedVat = net * rate;
          const diff = Math.abs(vat - expectedVat);
          
          if (diff < bestDiff && diff < net * 0.1) {
            bestDiff = diff;
            bestMatch = { net, vat: expectedVat, rate: rate * 100 };
          }
        }
      }
      
      if (bestMatch) {
        result.net = bestMatch.net;
        result.vat = bestMatch.vat;
        result.vatRate = bestMatch.rate;
      }
    }

    return result;
  }

  /**
   * Extrae descripción del texto
   */
  private static extractDescription(text: string): string | null {
    const descriptionPatterns = [
      /(?:concepto|descripción|detalle)[\s\.:]*([^\n]+)/i,
      /(?:trabajo|servicio|producto)[\s\.:]*([^\n]+)/i,
      /(?:reparación|mantenimiento|instalación)[\s\.:]*([^\n]+)/i,
    ];
    
    for (const pattern of descriptionPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Limpia y normaliza el nombre de empresa
   */
  private static cleanCompanyName(name: string): string {
    return name
      .trim()
      .replace(/^(factura\s+de|emisor|empresa)[\s\.:]*/, '')
      .replace(/\s*CIF[\s\.:]*[A-Z]\d{8}[A-Z0-9].*$/, '')
      .replace(/\s*NIF[\s\.:]*\d{8}[A-Z].*$/, '')
      .replace(/\s*Tel[\s\.:]*\d+.*$/, '')
      .replace(/\s*Email[\s\.:]*.*$/, '')
      .replace(/\s*www\..*$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Validación para nombres de empresa
   */
  private static isLikelyCompanyName(name: string): boolean {
    const indicators = [
      /S\.?L\.?(?:\s+U\.?)?|S\.?A\.?|C\.?B\.?/i,
      /\b(?:Empresa|Compañía|Sociedad|Servicios|Técnica?s?|Ingeniería|Instalaciones)\b/i,
      /\b(?:Climatización|Refrigeración|HVAC|Aire|Frío|Calor|Energía)\b/i,
      /\b(?:Mantenimiento|Reparaciones|Servicios)\b/i,
    ];

    const antiPatterns = [
      /\d{8,}/,
      /€|EUR|\d+[,\.]\d{2}/,
      /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{4}\b/,
      /^(Calle|Avda|Plaza|C\/)/i,
      /\b(Gmail|Hotmail|Yahoo|Outlook)\b/i,
      /^www\.|\.com|\.es$/i,
    ];

    const hasPositiveIndicator = indicators.some(pattern => pattern.test(name));
    const hasAntiPattern = antiPatterns.some(pattern => pattern.test(name));
    const hasValidLength = name.length >= 5 && name.length <= 60;
    const startsWithCapital = /^[A-ZÁÉÍÓÚÑ]/.test(name);
    
    return hasValidLength && startsWithCapital && !hasAntiPattern && (hasPositiveIndicator || name.length <= 40);
  }

  /**
   * Validación para números de factura
   */
  private static isLikelyInvoiceNumber(number: string): boolean {
    const validPatterns = [
      /^[A-Z]{1,4}\d{3,8}$/,
      /^[A-Z]{1,4}[-\/]\d{3,8}$/,
      /^\d{4}[-\/]\d{1,4}$/,
      /^\d{6,12}$/,
      /^[A-Z]\d{4}[-\/]?\d{1,4}$/,
    ];

    const antiPatterns = [
      /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/,
      /€/,
      /[,\.]\d{2}$/,
    ];

    const matchesValidPattern = validPatterns.some(pattern => pattern.test(number));
    const hasAntiPattern = antiPatterns.some(pattern => pattern.test(number));
    
    return matchesValidPattern && !hasAntiPattern && number.length >= 3 && number.length <= 20;
  }

  /**
   * Análisis contextual para mejorar precisión
   */
  private static analyzeContext(text: string, searchTerm: string): number {
    const lines = text.split('\n');
    let contextScore = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes(searchTerm.toLowerCase())) {
        if (i < 5) contextScore += 3;
        else if (i < 10) contextScore += 2;
        else if (i < lines.length / 2) contextScore += 1;
        
        const contextLines = [
          lines[i - 2], lines[i - 1], lines[i], lines[i + 1], lines[i + 2]
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (/factura|invoice/i.test(contextLines)) contextScore += 2;
        if (/emisor|proveedor|empresa/i.test(contextLines)) contextScore += 1;
        if (/fecha|date/i.test(contextLines)) contextScore += 1;
        if (/nº|núm|number/i.test(contextLines)) contextScore += 1;
        
        break;
      }
    }
    
    return contextScore;
  }

  /**
   * Parsea fechas en formato español
   */
  private static parseSpanishDate(dateStr: string): string | null {
    try {
      const cleaned = dateStr.replace(/[^\d\/\-]/g, '');
      const parts = cleaned.split(/[-\/]/);
      
      if (parts.length === 3) {
        let day = parseInt(parts[0]);
        let month = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2030) {
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
      }
    } catch (error) {
      console.warn('Error parsing date:', dateStr, error);
    }
    
    return null;
  }

  /**
   * Parsea números en formato español
   */
  private static parseSpanishNumber(numberStr: string): number {
    try {
      const cleaned = numberStr.replace(/[^\d,\.]/g, '');
      
      if (cleaned.includes(',') && cleaned.includes('.')) {
        const parts = cleaned.split(',');
        if (parts.length === 2) {
          const integer = parts[0].replace(/\./g, '');
          const decimal = parts[1];
          return parseFloat(`${integer}.${decimal}`);
        }
      }
      
      if (cleaned.includes(',') && !cleaned.includes('.')) {
        return parseFloat(cleaned.replace(',', '.'));
      }
      
      if (cleaned.includes('.') && !cleaned.includes(',')) {
        const parts = cleaned.split('.');
        if (parts.length === 2 && parts[1].length <= 2) {
          return parseFloat(cleaned);
        } else {
          return parseFloat(cleaned.replace(/\./g, ''));
        }
      }
      
      return parseFloat(cleaned);
    } catch (error) {
      console.warn('Error parsing number:', numberStr, error);
      return 0;
    }
  }
}