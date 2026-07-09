import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import Transaction from '../models/Transaction';
import Biller from '../models/Biller';
import fs from 'fs';
import path from 'path';

export class ReceiptGeneratorService {
  static async generateReceipt(transactionId: string): Promise<Buffer> {
    const tx = await Transaction.findOne({ transactionId });
    if (!tx) throw new Error('Transaction not found');
    
    const biller = await Biller.findOne({ billerId: tx.billerId });

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([400, 600]);
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Header
    page.drawText('SakhiCredit', { x: 50, y: height - 50, size: 24, font: boldFont, color: rgb(0.1, 0.4, 0.3) });
    page.drawText('Official BBPS Payment Receipt', { x: 50, y: height - 70, size: 12, font });

    // Divider
    page.drawLine({
      start: { x: 50, y: height - 90 },
      end: { x: width - 50, y: height - 90 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });

    // Details
    const startY = height - 130;
    const lineGap = 30;

    const details = [
      ['Transaction ID:', tx.transactionId],
      ['BBPS Ref ID:', tx.referenceId],
      ['Date:', tx.date.toLocaleString()],
      ['Status:', tx.status],
      ['Biller:', biller ? biller.name : tx.billerId],
      ['Amount Paid:', `Rs. ${tx.amount}`]
    ];

    details.forEach((item, index) => {
      page.drawText(item[0], { x: 50, y: startY - (index * lineGap), size: 12, font: boldFont });
      page.drawText(item[1], { x: 160, y: startY - (index * lineGap), size: 12, font });
    });

    // Footer
    page.drawText('Thank you for using SakhiCredit!', { x: 50, y: 100, size: 12, font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('This is a computer generated receipt.', { x: 50, y: 80, size: 10, font, color: rgb(0.5, 0.5, 0.5) });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
