import PDFDocument from 'pdfkit';
import { Order, Payment, OrderItem, MenuItem, Customer, Branch } from '@prisma/client';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export type OrderWithDetails = Order & {
  items: (OrderItem & {
    menuItem: MenuItem;
  })[];
  payment: Payment | null;
  customer: Customer | null;
  branch: Branch;
};

export const generateInvoice = async (orderId: string): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    // Fetch order with all necessary details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        payment: true,
        customer: true,
        branch: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set up the invoice directory
    const invoiceDir = path.join(process.cwd(), 'public', 'invoices');
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }
    
    // Define the output file path
    const fileName = `invoice-${order.orderNumber}.pdf`;
    const filePath = path.join(invoiceDir, fileName);
    const writeStream = fs.createWriteStream(filePath);
    
    // Pipe the PDF document to the file
    doc.pipe(writeStream);
    
    // Add restaurant logo
    // doc.image('path/to/logo.png', 50, 45, { width: 50 });
    
    // Add restaurant information
    doc.fontSize(20).text(`${order.branch.name}`, 50, 50);
    doc.fontSize(10).text(`${order.branch.address || 'Restaurant Address'}`, 50, 75);
    doc.text(`Phone: ${order.branch.phone || 'Restaurant Phone'}`, 50, 90);
    doc.text(`Email: ${order.branch.email || 'Restaurant Email'}`, 50, 105);
    
    // Add GST information if available
    if (order.branch.gstNumber) {
      doc.text(`GSTIN: ${order.branch.gstNumber}`, 50, 120);
    }
    
    // Add invoice title and number
    doc.fontSize(16).text('TAX INVOICE', 50, 150);
    doc.fontSize(10).text(`Invoice Number: ${order.taxInvoiceNumber || order.orderNumber}`, 50, 170);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 185);
    doc.text(`Time: ${new Date(order.createdAt).toLocaleTimeString()}`, 50, 200);
    
    // Add customer information if available
    if (order.customer) {
      doc.text('Bill To:', 300, 170);
      doc.text(`${order.customer.name}`, 300, 185);
      if (order.customer.phone) doc.text(`Phone: ${order.customer.phone}`, 300, 200);
      if (order.customer.email) doc.text(`Email: ${order.customer.email}`, 300, 215);
    }
    
    // Add order information
    doc.text(`Order Number: ${order.orderNumber}`, 50, 230);
    doc.text(`Order Type: ${order.type}`, 50, 245);
    if (order.tableId) doc.text(`Table: ${order.tableId}`, 50, 260);
    
    // Add payment information if available
    if (order.payment) {
      doc.text(`Payment Method: ${order.payment.paymentMethod}`, 300, 230);
      doc.text(`Payment Status: ${order.payment.paymentStatus}`, 300, 245);
      if (order.payment.paymentReference) {
        doc.text(`Reference: ${order.payment.paymentReference}`, 300, 260);
      }
    }
    
    // Add table headers
    doc.moveTo(50, 290).lineTo(550, 290).stroke();
    doc.text('Item', 50, 300);
    doc.text('Qty', 300, 300);
    doc.text('Price', 350, 300);
    doc.text('Amount', 450, 300);
    doc.moveTo(50, 315).lineTo(550, 315).stroke();
    
    // Add items
    let y = 330;
    order.items.forEach((item) => {
      doc.text(item.menuItem.name, 50, y);
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`₹${Number(item.price).toFixed(2)}`, 350, y);
      doc.text(`₹${(Number(item.price) * item.quantity).toFixed(2)}`, 450, y);
      y += 20;
    });
    
    // Add total line
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 15;
    
    // Add subtotal
    const subtotal = Number(order.totalAmount) - Number(order.tax);
    doc.text('Subtotal:', 350, y);
    doc.text(`₹${subtotal.toFixed(2)}`, 450, y);
    y += 20;
    
    // Add tax details
    if (order.cgst) {
      doc.text(`CGST (${(Number(order.cgst) / subtotal * 100).toFixed(2)}%):`, 350, y);
      doc.text(`₹${Number(order.cgst).toFixed(2)}`, 450, y);
      y += 20;
    }
    
    if (order.sgst) {
      doc.text(`SGST (${(Number(order.sgst) / subtotal * 100).toFixed(2)}%):`, 350, y);
      doc.text(`₹${Number(order.sgst).toFixed(2)}`, 450, y);
      y += 20;
    }
    
    if (order.igst) {
      doc.text(`IGST (${(Number(order.igst) / subtotal * 100).toFixed(2)}%):`, 350, y);
      doc.text(`₹${Number(order.igst).toFixed(2)}`, 450, y);
      y += 20;
    }
    
    if (!order.cgst && !order.sgst && !order.igst) {
      doc.text(`Tax (${(Number(order.tax) / subtotal * 100).toFixed(2)}%):`, 350, y);
      doc.text(`₹${Number(order.tax).toFixed(2)}`, 450, y);
      y += 20;
    }
    
    // Add discount if applicable
    if (order.discount) {
      doc.text('Discount:', 350, y);
      doc.text(`₹${Number(order.discount).toFixed(2)}`, 450, y);
      y += 20;
    }
    
    // Add total
    doc.moveTo(350, y).lineTo(550, y).stroke();
    y += 15;
    doc.fontSize(12).text('Total:', 350, y);
    doc.fontSize(12).text(`₹${Number(order.grandTotal).toFixed(2)}`, 450, y);
    
    // Add footer
    doc.fontSize(10).text('Thank you for your business!', 50, 700, { align: 'center' });
    
    // Finalize the PDF
    doc.end();
    
    // Wait for the file to be written
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        resolve({ 
          success: true, 
          filePath: `/invoices/${fileName}` 
        });
      });
      
      writeStream.on('error', (err) => {
        reject({ success: false, error: err.message });
      });
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error generating invoice' 
    };
  }
}; 