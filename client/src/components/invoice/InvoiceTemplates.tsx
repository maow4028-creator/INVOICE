import React, { useEffect, useState } from 'react';
import { Invoice } from '../../types/index.js';
import { generateQRCodeDataUrl } from '../../utils/qr.js';

interface InvoiceTemplateProps {
  invoice: Invoice;
  containerId?: string;
  showQrCode?: boolean;
}

export const InvoiceTemplateView: React.FC<InvoiceTemplateProps> = ({
  invoice,
  containerId = 'invoice-render-target',
  showQrCode = true,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (invoice.upiId && showQrCode) {
      // Standard UPI Payment URI
      const upiUri = `upi://pay?pa=${invoice.upiId}&pn=${encodeURIComponent(
        invoice.businessName || 'Business'
      )}&am=${invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal}&cu=${
        invoice.currency === 'INR' ? 'INR' : 'INR'
      }&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}`;

      generateQRCodeDataUrl(upiUri).then((url) => setQrCodeUrl(url));
    } else {
      setQrCodeUrl('');
    }
  }, [invoice.upiId, invoice.balanceDue, invoice.grandTotal, invoice.invoiceNumber, invoice.businessName, showQrCode]);

  const currency = invoice.currencySymbol || '₹';
  const accent = invoice.accentColor || '#123B5D';

  const formatMoney = (val: number) => {
    return `${currency}${Number(val || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadge = () => {
    const status = invoice.status || 'UNPAID';
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            PAID IN FULL
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            PARTIALLY PAID
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            OVERDUE
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            DRAFT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            UNPAID
          </span>
        );
    }
  };

  // Font family class or style
  const fontStyle = {
    fontFamily:
      invoice.fontFamily === 'Playfair Display'
        ? '"Playfair Display", Georgia, serif'
        : invoice.fontFamily === 'Outfit'
        ? '"Outfit", sans-serif'
        : invoice.fontFamily === 'Space Grotesk'
        ? '"Space Grotesk", monospace'
        : '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  // ==========================================
  // TEMPLATE 1: MODERN BLUE (Default)
  // ==========================================
  if (invoice.template === 'modern-blue' || !invoice.template) {
    return (
      <div
        id={containerId}
        style={fontStyle}
        className="w-full max-w-[800px] mx-auto bg-white p-8 md:p-12 rounded-xl shadow-lg border border-[#DCE5EB] text-[#183247] print:shadow-none print:border-none print:p-0"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#DCE5EB] pb-8 gap-6">
          <div className="flex items-start gap-4">
            {invoice.businessLogo ? (
              <img
                src={invoice.businessLogo}
                alt="Logo"
                className="w-16 h-16 object-contain rounded-lg border border-slate-200"
              />
            ) : (
              <div
                style={{ backgroundColor: accent }}
                className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-sm"
              >
                {(invoice.businessName || 'I').charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#123B5D]">
                {invoice.businessName || 'Your Business Name'}
              </h1>
              {invoice.businessAddress && (
                <p className="text-xs text-[#718596] mt-1 whitespace-pre-line max-w-xs">
                  {invoice.businessAddress}
                </p>
              )}
              <div className="text-xs text-[#718596] mt-2 space-y-0.5">
                {invoice.businessEmail && <p>Email: {invoice.businessEmail}</p>}
                {invoice.businessPhone && <p>Phone: {invoice.businessPhone}</p>}
                {invoice.businessGstin && <p className="font-medium text-[#183247]">GSTIN: {invoice.businessGstin}</p>}
                {invoice.businessPan && <p className="font-medium text-[#183247]">PAN: {invoice.businessPan}</p>}
              </div>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="flex items-center md:justify-end gap-3 mb-2">
              <h2 style={{ color: accent }} className="text-3xl font-extrabold tracking-wider uppercase">
                INVOICE
              </h2>
              {getStatusBadge()}
            </div>
            <p className="text-sm font-semibold text-[#183247]">
              # {invoice.invoiceNumber || 'INV-0001'}
            </p>
            <div className="mt-3 text-xs text-[#718596] space-y-1">
              <p>
                <span className="font-medium text-[#183247]">Date:</span>{' '}
                {new Date(invoice.invoiceDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <p>
                <span className="font-medium text-[#183247]">Due Date:</span>{' '}
                {new Date(invoice.dueDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <p>
                <span className="font-medium text-[#183247]">Terms:</span> {invoice.paymentTerms}
              </p>
            </div>
          </div>
        </div>

        {/* Bill To & Metadata Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
          <div className="bg-[#EAF6FC] p-5 rounded-lg border border-[#DCE5EB]/70">
            <span className="text-[11px] font-bold tracking-wider text-[#55B9E8] uppercase">
              BILLED TO
            </span>
            <h3 className="text-base font-bold text-[#123B5D] mt-1">
              {invoice.clientName || 'Client Name'}
            </h3>
            {invoice.clientAddress && (
              <p className="text-xs text-[#718596] mt-1 whitespace-pre-line">
                {invoice.clientAddress}
              </p>
            )}
            <div className="text-xs text-[#718596] mt-2 space-y-0.5">
              {invoice.clientEmail && <p>Email: {invoice.clientEmail}</p>}
              {invoice.clientPhone && <p>Phone: {invoice.clientPhone}</p>}
              {invoice.clientGstin && <p className="font-semibold text-[#183247]">GSTIN: {invoice.clientGstin}</p>}
              {invoice.clientPan && <p className="font-semibold text-[#183247]">PAN: {invoice.clientPan}</p>}
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-lg border border-[#DCE5EB] flex flex-col justify-between">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-xs text-[#718596]">Total Amount</span>
              <span className="text-sm font-bold text-[#183247]">{formatMoney(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="text-xs text-[#718596]">Amount Paid</span>
              <span className="text-sm font-semibold text-emerald-600">{formatMoney(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-bold text-[#123B5D]">BALANCE DUE</span>
              <span style={{ color: accent }} className="text-xl font-extrabold">
                {formatMoney(invoice.balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto my-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ backgroundColor: accent }} className="text-white rounded-t-lg">
                <th className="py-3 px-4 rounded-tl-lg font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Item & Description</th>
                <th className="py-3 px-3 text-center font-semibold">Qty</th>
                <th className="py-3 px-3 text-right font-semibold">Unit Price</th>
                <th className="py-3 px-3 text-center font-semibold">Tax %</th>
                {invoice.items.some((i) => (i.discount || 0) > 0) && (
                  <th className="py-3 px-3 text-right font-semibold">Disc</th>
                )}
                <th className="py-3 px-4 text-right rounded-tr-lg font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE5EB] border-b border-[#DCE5EB]">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F7F9]/50'}>
                  <td className="py-3.5 px-4 text-[#718596]">{idx + 1}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#183247]">{item.name}</p>
                    {item.description && (
                      <p className="text-[11px] text-[#718596] mt-0.5 whitespace-pre-line">
                        {item.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center text-[#183247]">{item.quantity}</td>
                  <td className="py-3.5 px-3 text-right text-[#183247]">{formatMoney(item.unitPrice)}</td>
                  <td className="py-3.5 px-3 text-center text-[#718596]">{item.taxPercentage}%</td>
                  {invoice.items.some((i) => (i.discount || 0) > 0) && (
                    <td className="py-3.5 px-3 text-right text-[#718596]">
                      {item.discount ? formatMoney(item.discount) : '-'}
                    </td>
                  )}
                  <td className="py-3.5 px-4 text-right font-semibold text-[#183247]">
                    {formatMoney(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Payment Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 my-6 items-start">
          <div className="md:col-span-7 space-y-4">
            {/* Payment Details & UPI QR Code */}
            {(invoice.bankDetails || invoice.upiId || invoice.paymentInstructions) && (
              <div className="bg-[#F5F7F9] p-4 rounded-lg border border-[#DCE5EB] text-xs space-y-2">
                <h4 className="font-bold text-[#123B5D] text-xs uppercase tracking-wider">
                  Payment Instructions
                </h4>
                {invoice.paymentInstructions && (
                  <p className="text-[#718596] whitespace-pre-line">{invoice.paymentInstructions}</p>
                )}
                {invoice.bankDetails && (
                  <div className="pt-1">
                    <span className="font-semibold text-[#183247]">Bank Details: </span>
                    <span className="text-[#718596] whitespace-pre-line">{invoice.bankDetails}</span>
                  </div>
                )}
                {invoice.upiId && (
                  <div className="flex items-center gap-3 pt-1">
                    <div>
                      <span className="font-semibold text-[#183247]">UPI ID: </span>
                      <span className="font-mono text-[#55B9E8] font-bold">{invoice.upiId}</span>
                    </div>
                  </div>
                )}

                {qrCodeUrl && (
                  <div className="pt-2 flex items-center gap-3 border-t border-slate-200 mt-2">
                    <img src={qrCodeUrl} alt="UPI QR" className="w-20 h-20 rounded border border-slate-200" />
                    <div>
                      <p className="font-semibold text-[#183247] text-[11px]">Scan to Pay via UPI</p>
                      <p className="text-[10px] text-[#718596]">Google Pay, PhonePe, Paytm or BHIM</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {invoice.notes && (
              <div className="text-xs">
                <span className="font-semibold text-[#183247]">Notes:</span>
                <p className="text-[#718596] mt-0.5 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="md:col-span-5 bg-slate-50 p-4 rounded-lg border border-[#DCE5EB] text-xs space-y-2">
            <div className="flex justify-between py-1 text-[#718596]">
              <span>Subtotal</span>
              <span className="font-medium text-[#183247]">{formatMoney(invoice.subtotal)}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Discount {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</span>
                <span>-{formatMoney(invoice.discountAmount)}</span>
              </div>
            )}

            {invoice.taxTotal > 0 && (
              <div className="flex justify-between py-1 text-[#718596]">
                <span>Taxes</span>
                <span className="font-medium text-[#183247]">{formatMoney(invoice.taxTotal)}</span>
              </div>
            )}

            {invoice.shipping > 0 && (
              <div className="flex justify-between py-1 text-[#718596]">
                <span>Shipping</span>
                <span className="font-medium text-[#183247]">{formatMoney(invoice.shipping)}</span>
              </div>
            )}

            {invoice.additionalCharges > 0 && (
              <div className="flex justify-between py-1 text-[#718596]">
                <span>Additional Charges</span>
                <span className="font-medium text-[#183247]">{formatMoney(invoice.additionalCharges)}</span>
              </div>
            )}

            <div className="border-t-2 border-[#123B5D] pt-2.5 mt-2 flex justify-between items-center text-sm font-bold text-[#123B5D]">
              <span>Grand Total</span>
              <span className="text-base">{formatMoney(invoice.grandTotal)}</span>
            </div>

            {invoice.amountPaid > 0 && (
              <div className="flex justify-between py-1 text-emerald-600 font-medium">
                <span>Amount Paid</span>
                <span>-{formatMoney(invoice.amountPaid)}</span>
              </div>
            )}

            <div
              style={{ backgroundColor: accent }}
              className="p-3 rounded-md text-white flex justify-between items-center font-bold text-sm mt-3"
            >
              <span>Balance Due</span>
              <span className="text-base">{formatMoney(invoice.balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions Footer */}
        {invoice.terms && (
          <div className="border-t border-[#DCE5EB] pt-6 mt-8 text-[11px] text-[#718596]">
            <h5 className="font-bold text-[#183247] uppercase tracking-wider mb-1">
              Terms & Conditions
            </h5>
            <p className="whitespace-pre-line leading-relaxed">{invoice.terms}</p>
          </div>
        )}

        <div className="text-center pt-8 mt-6 border-t border-[#DCE5EB]/60">
          <p className="text-xs font-semibold text-[#123B5D] italic">
            {invoice.thankYouMessage || 'Thank you for your business!'}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // TEMPLATE 2: MINIMAL WHITE
  // ==========================================
  if (invoice.template === 'minimal-white') {
    return (
      <div
        id={containerId}
        style={fontStyle}
        className="w-full max-w-[800px] mx-auto bg-white p-10 md:p-14 rounded-none shadow-sm border border-slate-200 text-[#183247] print:shadow-none print:border-none print:p-0"
      >
        <div className="flex justify-between items-start border-b border-slate-900 pb-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-slate-900">
              {invoice.businessName || 'Business Name'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-sm whitespace-pre-line">
              {invoice.businessAddress}
            </p>
            <div className="text-xs text-slate-500 mt-2 space-y-0.5">
              {invoice.businessEmail && <div>{invoice.businessEmail}</div>}
              {invoice.businessPhone && <div>{invoice.businessPhone}</div>}
              {invoice.businessGstin && <div>GSTIN: {invoice.businessGstin}</div>}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs tracking-widest uppercase font-semibold text-slate-400">
              INVOICE
            </span>
            <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
              {invoice.invoiceNumber}
            </div>
            <div className="mt-2 text-xs text-slate-500 space-y-1">
              <div>Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</div>
              <div>Due: {new Date(invoice.dueDate).toLocaleDateString()}</div>
              <div>{getStatusBadge()}</div>
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="my-8 py-4 border-b border-slate-100 flex justify-between">
          <div>
            <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400">
              BILLED TO:
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1">{invoice.clientName}</div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm whitespace-pre-line">
              {invoice.clientAddress}
            </p>
            {invoice.clientEmail && <p className="text-xs text-slate-500 mt-1">{invoice.clientEmail}</p>}
          </div>
          <div className="text-right">
            <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400">
              AMOUNT DUE
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {formatMoney(invoice.balanceDue)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Terms: {invoice.paymentTerms}</div>
          </div>
        </div>

        {/* Clean Items Table */}
        <table className="w-full text-xs text-left my-8">
          <thead>
            <tr className="border-b border-slate-300 text-slate-400 font-medium tracking-wider uppercase text-[10px]">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Tax</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3 pr-4">
                  <div className="font-semibold text-slate-800">{item.name}</div>
                  {item.description && (
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                  )}
                </td>
                <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                <td className="py-3 text-right text-slate-600">{formatMoney(item.unitPrice)}</td>
                <td className="py-3 text-right text-slate-500">{item.taxPercentage}%</td>
                <td className="py-3 text-right font-medium text-slate-900">{formatMoney(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Minimal Totals */}
        <div className="flex justify-end my-6">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="text-slate-800">{formatMoney(invoice.subtotal)}</span>
            </div>
            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span className="text-slate-800">{formatMoney(invoice.taxTotal)}</span>
              </div>
            )}
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-{formatMoney(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-slate-900 pt-2 flex justify-between font-bold text-sm text-slate-900">
              <span>Total</span>
              <span>{formatMoney(invoice.grandTotal)}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Paid</span>
                <span>-{formatMoney(invoice.amountPaid)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
              <span>Balance</span>
              <span className="font-mono text-base">{formatMoney(invoice.balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Bank & Footer */}
        <div className="border-t border-slate-200 pt-6 mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500">
          <div>
            {invoice.bankDetails && (
              <div>
                <span className="font-semibold text-slate-700">Bank Info: </span>
                {invoice.bankDetails}
              </div>
            )}
            {invoice.upiId && <div className="mt-1">UPI: {invoice.upiId}</div>}
          </div>
          {qrCodeUrl && (
            <div className="flex items-center justify-end gap-2">
              <img src={qrCodeUrl} alt="UPI QR" className="w-16 h-16 border border-slate-200" />
              <div className="text-[10px]">Scan with any UPI app</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // TEMPLATE 3: CORPORATE PROFESSIONAL
  // ==========================================
  if (invoice.template === 'corporate-pro') {
    return (
      <div
        id={containerId}
        style={{ ...fontStyle, borderTopColor: accent }}
        className="w-full max-w-[800px] mx-auto bg-white p-8 md:p-12 rounded-lg shadow-md border-t-8 text-[#183247] print:shadow-none print:border-none print:p-0"
      >
        <div className="flex justify-between items-start pb-6 border-b-2 border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {invoice.businessName || 'Corporate Enterprise'}
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-sm whitespace-pre-line">
              {invoice.businessAddress}
            </p>
            <div className="text-xs text-slate-600 mt-2 space-y-0.5">
              {invoice.businessEmail && <p>E: {invoice.businessEmail} | T: {invoice.businessPhone}</p>}
              {invoice.businessGstin && <p className="font-medium text-slate-800">GSTIN: {invoice.businessGstin}</p>}
              {invoice.businessPan && <p className="font-medium text-slate-800">PAN: {invoice.businessPan}</p>}
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-bold tracking-wider text-slate-800">INVOICE</h2>
            <div className="text-sm font-bold text-slate-900 mt-1">Ref: {invoice.invoiceNumber}</div>
            <div className="mt-2 text-xs text-slate-600">
              <p>Issue Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
              <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
            <div className="mt-2">{getStatusBadge()}</div>
          </div>
        </div>

        {/* Corporate 2-column Client / Shipment details */}
        <div className="grid grid-cols-2 gap-6 my-6 bg-slate-50 p-4 border border-slate-200 rounded">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              CLIENT DETAILS
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1">{invoice.clientName}</div>
            <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">{invoice.clientAddress}</p>
            {invoice.clientGstin && <p className="text-xs text-slate-700 mt-1 font-medium">GSTIN: {invoice.clientGstin}</p>}
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              PAYMENT SPECIFICATIONS
            </span>
            <div className="text-xs text-slate-700 mt-1 space-y-1">
              <p><span className="font-semibold">Payment Terms:</span> {invoice.paymentTerms}</p>
              <p><span className="font-semibold">Currency:</span> {invoice.currency}</p>
              {invoice.upiId && <p><span className="font-semibold">UPI ID:</span> {invoice.upiId}</p>}
            </div>
          </div>
        </div>

        {/* Corporate Grid Table */}
        <table className="w-full text-xs text-left border border-slate-300 my-6">
          <thead className="bg-slate-800 text-white font-semibold">
            <tr>
              <th className="py-2.5 px-3 border border-slate-700">#</th>
              <th className="py-2.5 px-3 border border-slate-700">Description</th>
              <th className="py-2.5 px-3 text-center border border-slate-700">Qty</th>
              <th className="py-2.5 px-3 text-right border border-slate-700">Rate</th>
              <th className="py-2.5 px-3 text-center border border-slate-700">Tax</th>
              <th className="py-2.5 px-3 text-right border border-slate-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="py-2.5 px-3 border border-slate-200 text-center">{idx + 1}</td>
                <td className="py-2.5 px-3 border border-slate-200">
                  <span className="font-semibold text-slate-900">{item.name}</span>
                  {item.description && (
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                  )}
                </td>
                <td className="py-2.5 px-3 border border-slate-200 text-center">{item.quantity}</td>
                <td className="py-2.5 px-3 border border-slate-200 text-right">{formatMoney(item.unitPrice)}</td>
                <td className="py-2.5 px-3 border border-slate-200 text-center">{item.taxPercentage}%</td>
                <td className="py-2.5 px-3 border border-slate-200 text-right font-medium">{formatMoney(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Corporate Calculation Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div className="border border-slate-200 p-4 rounded bg-slate-50 text-xs">
            <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wide">
              Bank Remittance Details
            </h4>
            <p className="text-slate-600 whitespace-pre-line leading-relaxed">
              {invoice.bankDetails || 'Please contact accounting for wire transfer routing.'}
            </p>
            {qrCodeUrl && (
              <div className="mt-3 flex items-center gap-3">
                <img src={qrCodeUrl} alt="QR" className="w-16 h-16 border border-slate-300" />
                <div className="text-[10px] text-slate-500">Scan to initiate immediate wire or UPI clearance.</div>
              </div>
            )}
          </div>

          <div className="border border-slate-200 p-4 rounded bg-white text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">{formatMoney(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-{formatMoney(invoice.discountAmount)}</span>
              </div>
            )}
            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Taxes:</span>
                <span className="font-semibold text-slate-900">{formatMoney(invoice.taxTotal)}</span>
              </div>
            )}
            <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-sm text-slate-900">
              <span>Invoice Total:</span>
              <span>{formatMoney(invoice.grandTotal)}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Total Paid:</span>
                <span>-{formatMoney(invoice.amountPaid)}</span>
              </div>
            )}
            <div className="bg-slate-100 p-2.5 rounded flex justify-between items-center font-bold text-slate-900">
              <span>Balance Due:</span>
              <span className="text-base font-mono">{formatMoney(invoice.balanceDue)}</span>
            </div>
          </div>
        </div>

        {invoice.terms && (
          <div className="border-t border-slate-200 pt-4 mt-6 text-[11px] text-slate-500">
            <p className="font-bold text-slate-700">Contractual Terms:</p>
            <p className="whitespace-pre-line mt-0.5">{invoice.terms}</p>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // TEMPLATE 4: ELEGANT BUSINESS
  // ==========================================
  return (
    <div
      id={containerId}
      style={fontStyle}
      className="w-full max-w-[800px] mx-auto bg-white rounded-xl shadow-lg border border-[#DCE5EB] overflow-hidden text-[#183247] print:shadow-none print:border-none print:rounded-none"
    >
      {/* Top Navy Executive Banner */}
      <div className="bg-[#123B5D] text-white p-8 md:p-10 flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <div className="inline-block px-2.5 py-0.5 rounded bg-[#55B9E8]/20 text-[#55B9E8] text-xs font-bold tracking-widest uppercase mb-2">
            OFFICIAL INVOICE
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {invoice.businessName || 'Executive Enterprise'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-sm whitespace-pre-line">
            {invoice.businessAddress}
          </p>
          <div className="text-xs text-slate-300 mt-2 space-y-0.5">
            {invoice.businessEmail && <div>{invoice.businessEmail}</div>}
            {invoice.businessPhone && <div>{invoice.businessPhone}</div>}
          </div>
        </div>

        <div className="text-left md:text-right">
          <div className="text-2xl font-bold tracking-wider font-mono text-white">
            {invoice.invoiceNumber}
          </div>
          <div className="mt-2 text-xs text-slate-300 space-y-1">
            <p>Invoice Date: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
            <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
          <div className="mt-3">{getStatusBadge()}</div>
        </div>
      </div>

      <div className="p-8 md:p-10">
        {/* Bill to card */}
        <div className="bg-[#EAF6FC]/60 p-5 rounded-lg border border-[#DCE5EB] flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold text-[#55B9E8] uppercase tracking-wider">
              CLIENT / RECIPIENT
            </span>
            <h3 className="text-base font-bold text-[#123B5D] mt-1">{invoice.clientName}</h3>
            <p className="text-xs text-[#718596] mt-0.5 max-w-sm whitespace-pre-line">{invoice.clientAddress}</p>
            {invoice.clientEmail && <p className="text-xs text-[#718596] mt-1">{invoice.clientEmail}</p>}
          </div>

          <div className="text-left md:text-right">
            <span className="text-[11px] font-bold text-[#718596] uppercase tracking-wider">
              PAYMENT DUE
            </span>
            <div className="text-2xl font-extrabold text-[#123B5D] mt-1">
              {formatMoney(invoice.balanceDue)}
            </div>
            <p className="text-xs text-[#718596] mt-0.5">Payment Terms: {invoice.paymentTerms}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-xs text-left my-6">
          <thead>
            <tr className="border-b-2 border-[#123B5D] text-[#123B5D] font-bold uppercase text-[11px]">
              <th className="py-3 px-2">#</th>
              <th className="py-3 px-3">Description</th>
              <th className="py-3 px-3 text-center">Qty</th>
              <th className="py-3 px-3 text-right">Price</th>
              <th className="py-3 px-3 text-center">Tax</th>
              <th className="py-3 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE5EB]">
            {invoice.items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="py-3 px-2 text-[#718596]">{idx + 1}</td>
                <td className="py-3 px-3">
                  <div className="font-bold text-[#183247]">{item.name}</div>
                  {item.description && (
                    <div className="text-[11px] text-[#718596] mt-0.5">{item.description}</div>
                  )}
                </td>
                <td className="py-3 px-3 text-center text-[#183247]">{item.quantity}</td>
                <td className="py-3 px-3 text-right text-[#183247]">{formatMoney(item.unitPrice)}</td>
                <td className="py-3 px-3 text-center text-[#718596]">{item.taxPercentage}%</td>
                <td className="py-3 px-3 text-right font-bold text-[#123B5D]">{formatMoney(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 items-start">
          <div className="space-y-4 text-xs">
            {invoice.bankDetails && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="font-bold text-[#123B5D]">Wire Transfer / Banking Details:</span>
                <p className="text-[#718596] whitespace-pre-line mt-1">{invoice.bankDetails}</p>
                {invoice.upiId && <p className="mt-1 font-semibold text-[#183247]">UPI ID: {invoice.upiId}</p>}
                {qrCodeUrl && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={qrCodeUrl} alt="UPI QR" className="w-16 h-16 border rounded" />
                    <span className="text-[11px] text-[#718596]">Scan with phone to remit payment</span>
                  </div>
                )}
              </div>
            )}

            {invoice.notes && (
              <div>
                <span className="font-bold text-[#123B5D]">Notes:</span>
                <p className="text-[#718596] mt-0.5 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-[#F5F7F9] p-5 rounded-lg border border-[#DCE5EB] space-y-2 text-xs">
            <div className="flex justify-between text-[#718596]">
              <span>Subtotal</span>
              <span className="font-medium text-[#183247]">{formatMoney(invoice.subtotal)}</span>
            </div>
            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-[#718596]">
                <span>Taxes</span>
                <span className="font-medium text-[#183247]">{formatMoney(invoice.taxTotal)}</span>
              </div>
            )}
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-{formatMoney(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-[#DCE5EB] pt-2 flex justify-between text-sm font-bold text-[#123B5D]">
              <span>Grand Total</span>
              <span className="text-base">{formatMoney(invoice.grandTotal)}</span>
            </div>
            {invoice.amountPaid > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Amount Paid</span>
                <span>-{formatMoney(invoice.amountPaid)}</span>
              </div>
            )}
            <div className="bg-[#123B5D] text-white p-3 rounded flex justify-between items-center font-bold text-sm mt-2">
              <span>Balance Due</span>
              <span className="text-base">{formatMoney(invoice.balanceDue)}</span>
            </div>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-[#DCE5EB] text-xs text-[#718596] italic">
          {invoice.thankYouMessage || 'Thank you for your business!'}
        </div>
      </div>
    </div>
  );
};
