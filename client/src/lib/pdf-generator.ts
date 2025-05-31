import jsPDF from 'jspdf';

interface Service {
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  validityDays: number;
  terms?: string;
  quoteNumber: string;
  services: Service[];
  grandTotal: number;
}

export class PDFGenerator {
  private doc: jsPDF;
  private readonly pageWidth = 210; // A4 width in mm
  private readonly pageHeight = 297; // A4 height in mm
  private readonly margin = 20;
  private yPosition = 20;

  constructor() {
    this.doc = new jsPDF();
  }

  generateQuotePDF(data: QuoteData): void {
    this.addHeader();
    this.addCompanyInfo();
    this.addQuoteDetails(data);
    this.addClientInfo(data);
    this.addServicesTable(data.services);
    this.addTotalSection(data.grandTotal);
    this.addTermsAndConditions(data.terms || '');
    this.addFooter();
  }

  private addHeader(): void {
    // Company logo placeholder (using text for now)
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(41, 128, 185); // Construction blue
    this.doc.text('LAZOPE CONSTRUCTION', this.margin, this.yPosition);
    
    this.yPosition += 8;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Professional Construction Services', this.margin, this.yPosition);
    
    // Quote title on the right
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('QUOTATION', this.pageWidth - 60, 20);
    
    this.yPosition += 15;
    this.addSeparator();
  }

  private addCompanyInfo(): void {
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    const companyInfo = [
      'Email: info@lazopeconstruction.com',
      'Phone: +263 77 123 4567',
      'Address: 123 Construction Ave, Harare, Zimbabwe'
    ];
    
    companyInfo.forEach(line => {
      this.doc.text(line, this.margin, this.yPosition);
      this.yPosition += 4;
    });
    
    this.yPosition += 10;
  }

  private addQuoteDetails(data: QuoteData): void {
    const currentDate = new Date().toLocaleDateString('en-GB');
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + data.validityDays);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    
    // Quote details box
    const boxX = this.pageWidth - 80;
    const boxY = this.yPosition;
    const boxWidth = 60;
    const boxHeight = 25;
    
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(boxX, boxY, boxWidth, boxHeight);
    
    this.doc.text('Quote Number:', boxX + 2, boxY + 5);
    this.doc.text('Date:', boxX + 2, boxY + 10);
    this.doc.text('Valid Until:', boxX + 2, boxY + 15);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(data.quoteNumber, boxX + 2, boxY + 8);
    this.doc.text(currentDate, boxX + 2, boxY + 13);
    this.doc.text(validUntil.toLocaleDateString('en-GB'), boxX + 2, boxY + 18);
    
    this.yPosition = boxY + boxHeight + 10;
  }

  private addClientInfo(data: QuoteData): void {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('BILL TO:', this.margin, this.yPosition);
    
    this.yPosition += 6;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const clientInfo = [
      data.clientName,
      data.clientEmail,
      data.clientPhone,
      data.clientAddress
    ];
    
    clientInfo.forEach(line => {
      this.doc.text(line, this.margin, this.yPosition);
      this.yPosition += 4;
    });
    
    this.yPosition += 10;
  }

  private addServicesTable(services: Service[]): void {
    // Table header
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFillColor(41, 128, 185); // Construction blue
    this.doc.setTextColor(255, 255, 255);
    
    const tableStartY = this.yPosition;
    const rowHeight = 8;
    const colWidths = [80, 20, 20, 25, 25]; // Description, Unit, Qty, Unit Price, Total
    let currentX = this.margin;
    
    // Draw header background
    this.doc.rect(this.margin, tableStartY, 170, rowHeight, 'F');
    
    // Header text
    const headers = ['Description', 'Unit', 'Qty', 'Unit Price', 'Total'];
    headers.forEach((header, index) => {
      this.doc.text(header, currentX + 2, tableStartY + 5);
      currentX += colWidths[index];
    });
    
    this.yPosition = tableStartY + rowHeight;
    
    // Table rows
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    services.forEach((service, index) => {
      const isEven = index % 2 === 0;
      if (isEven) {
        this.doc.setFillColor(248, 248, 248);
        this.doc.rect(this.margin, this.yPosition, 170, rowHeight, 'F');
      }
      
      currentX = this.margin;
      const rowData = [
        service.description,
        service.unit,
        service.quantity.toString(),
        `$${service.unitPrice.toFixed(2)}`,
        `$${(service.quantity * service.unitPrice).toFixed(2)}`
      ];
      
      rowData.forEach((data, colIndex) => {
        this.doc.text(data, currentX + 2, this.yPosition + 5);
        currentX += colWidths[colIndex];
      });
      
      this.yPosition += rowHeight;
    });
    
    // Draw table borders
    this.doc.setDrawColor(200, 200, 200);
    currentX = this.margin;
    
    // Vertical lines
    for (let i = 0; i <= colWidths.length; i++) {
      this.doc.line(currentX, tableStartY, currentX, this.yPosition);
      if (i < colWidths.length) currentX += colWidths[i];
    }
    
    // Horizontal lines
    for (let i = 0; i <= services.length + 1; i++) {
      const y = tableStartY + (i * rowHeight);
      this.doc.line(this.margin, y, this.margin + 170, y);
    }
    
    this.yPosition += 5;
  }

  private addTotalSection(grandTotal: number): void {
    const totalBoxX = this.pageWidth - 70;
    const totalBoxY = this.yPosition;
    const totalBoxWidth = 50;
    const totalBoxHeight = 12;
    
    this.doc.setFillColor(255, 140, 0); // Construction orange
    this.doc.rect(totalBoxX, totalBoxY, totalBoxWidth, totalBoxHeight, 'F');
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(255, 255, 255);
    this.doc.text('TOTAL:', totalBoxX + 2, totalBoxY + 4);
    this.doc.text(`$${grandTotal.toFixed(2)}`, totalBoxX + 2, totalBoxY + 8);
    
    this.yPosition = totalBoxY + totalBoxHeight + 15;
  }

  private addTermsAndConditions(terms: string): void {
    if (!terms.trim()) return;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('TERMS & CONDITIONS:', this.margin, this.yPosition);
    
    this.yPosition += 6;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(60, 60, 60);
    
    const splitTerms = this.doc.splitTextToSize(terms, this.pageWidth - (this.margin * 2));
    this.doc.text(splitTerms, this.margin, this.yPosition);
    
    this.yPosition += splitTerms.length * 4 + 10;
  }

  private addFooter(): void {
    const footerY = this.pageHeight - 30;
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    
    this.doc.text('Thank you for choosing Lazope Construction Company', this.margin, footerY);
    this.doc.text('This quote is valid for the specified period. All prices are in USD.', this.margin, footerY + 4);
    
    this.addSeparator(footerY - 5);
  }

  private addSeparator(y?: number): void {
    const separatorY = y || this.yPosition;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, separatorY, this.pageWidth - this.margin, separatorY);
    if (!y) this.yPosition += 5;
  }

  save(filename: string): void {
    this.doc.save(filename);
  }

  output(): string {
    try {
      return this.doc.output('datauri');
    } catch (error) {
      console.error('PDF output error:', error);
      return '';
    }
  }
}