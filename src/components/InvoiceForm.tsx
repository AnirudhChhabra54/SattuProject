import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { MainRow, OldRow } from '../types/invoice';

const MAX_MAIN_ROWS = 8;
const MAX_OLD_ROWS = 3;

// Generate estimate number
let estCounter = parseInt(localStorage.getItem('pj_est_counter') || '0');

function getNextEstimateNumber(): string {
    estCounter++;
    localStorage.setItem('pj_est_counter', estCounter.toString());
    return `PJ-${String(estCounter).padStart(3, '0')}`;
}

function getTodayString(): string {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

// Convert number to words (Indian numbering system)
function numberToWords(num: number): string {
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    function convertLessThanThousand(n: number): string {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 > 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    }

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = '';
    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim();
}

function formatCurrency(num: number): string {
    return Math.round(num).toLocaleString('en-IN');
}

export default function InvoiceForm() {
    const [custName, setCustName] = useState('');
    const [estNo, setEstNo] = useState(getNextEstimateNumber);
    const [date] = useState(getTodayString);
    const [printSize, setPrintSize] = useState<'A4' | 'A5'>('A4');
    const [goldRate, setGoldRate] = useState('');
    const [silverRate, setSilverRate] = useState('');
    const [narration, setNarration] = useState('');

    const [mainRows, setMainRows] = useState<MainRow[]>([
        { id: Date.now(), desc: '', wt: '', rate: '', misc: '', amt: '' }
    ]);

    const [oldRows, setOldRows] = useState<OldRow[]>([
        { id: Date.now() + 1, desc: '', wt: '', purity: '', rate: '', val: '' }
    ]);

    // Add main row
    const addMainRow = useCallback(() => {
        if (mainRows.length >= MAX_MAIN_ROWS) {
            alert(`Maximum ${MAX_MAIN_ROWS} items allowed to fit on one page.`);
            return;
        }
        setMainRows(prev => [...prev, { id: Date.now(), desc: '', wt: '', rate: '', misc: '', amt: '' }]);
    }, [mainRows.length]);

    // Add old row
    const addOldRow = useCallback(() => {
        if (oldRows.length >= MAX_OLD_ROWS) {
            alert(`Maximum ${MAX_OLD_ROWS} old items allowed to fit on one page.`);
            return;
        }
        setOldRows(prev => [...prev, { id: Date.now(), desc: '', wt: '', purity: '', rate: '', val: '' }]);
    }, [oldRows.length]);

    // Update main row
    const updateMainRow = useCallback((id: number, field: keyof MainRow, value: string) => {
        setMainRows(prev => prev.map(row => {
            if (row.id !== id) return row;
            const updated = { ...row, [field]: value };

            // Auto-calculate amount
            if (field === 'wt' || field === 'rate' || field === 'misc') {
                const wt = parseFloat(updated.wt) || 0;
                const rate = parseFloat(updated.rate) || 0;
                const misc = parseFloat(updated.misc) || 0;
                if (wt > 0 || misc > 0) {
                    updated.amt = String((wt * rate) + misc);
                }
            }
            return updated;
        }));
    }, []);

    // Update old row
    const updateOldRow = useCallback((id: number, field: keyof OldRow, value: string) => {
        setOldRows(prev => prev.map(row => {
            if (row.id !== id) return row;
            const updated = { ...row, [field]: value };

            // Auto-calculate value
            if (field === 'wt' || field === 'rate' || field === 'purity') {
                const wt = parseFloat(updated.wt) || 0;
                const rate = parseFloat(updated.rate) || 0;
                const purity = parseFloat(updated.purity) || 0;
                if (wt > 0 || rate > 0) {
                    updated.val = String(wt * rate * (purity / 100));
                }
            }
            return updated;
        }));
    }, []);

    // Delete rows
    const deleteMainRow = useCallback((id: number) => {
        if (mainRows.length <= 1) return;
        setMainRows(prev => prev.filter(r => r.id !== id));
    }, [mainRows.length]);

    const deleteOldRow = useCallback((id: number) => {
        if (oldRows.length <= 1) {
            setOldRows([{ id: oldRows[0].id, desc: '', wt: '', purity: '100', rate: '', val: '' }]);
            return;
        }
        setOldRows(prev => prev.filter(r => r.id !== id));
    }, [oldRows]);

    // Calculate totals
    const subtotal = mainRows.reduce((sum, r) => sum + (parseFloat(r.amt) || 0), 0);
    const oldTotal = oldRows.reduce((sum, r) => sum + (parseFloat(r.val) || 0), 0);
    const grandTotal = subtotal - oldTotal;

    // Check if old items have actual content
    const hasOldItems = oldRows.some(r => {
        const desc = (r.desc || '').trim();
        const wt = parseFloat(r.wt) || 0;
        const val = parseFloat(r.val) || 0;
        return desc.length > 0 || wt > 0 || val > 0;
    });

    // Print function
    const handlePrint = () => {
        window.print();
    };

    // Reset function
    const handleReset = () => {
        if (confirm('Are you sure you want to clear the entire form?')) {
            setCustName('');
            // Reset estimate number logic if needed, but usually keep incrementing
            // setEstNo(getNextEstimateNumber()); // Optional: force new number
            setMainRows([{ id: Date.now(), desc: '', wt: '', rate: '', misc: '', amt: '' }]);
            setOldRows([{ id: Date.now() + 1, desc: '', wt: '', purity: '', rate: '', val: '' }]);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Controls - hidden during print */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 no-print">
                <div className="bg-white rounded-full shadow-lg p-1 flex">
                    <button
                        onClick={() => setPrintSize('A4')}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition ${printSize === 'A4' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        A4
                    </button>
                    <button
                        onClick={() => setPrintSize('A5')}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition ${printSize === 'A5' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        A5
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="bg-gray-500 text-white px-4 py-3 rounded-full font-semibold shadow-lg hover:bg-gray-600 transition flex items-center gap-2"
                        title="Reset Form"
                    >
                        🔄 Reset
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-amber-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-amber-700 transition flex items-center gap-2"
                    >
                        🖨️ Print Invoice
                    </button>
                </div>
            </div>

            {/* Invoice Form */}
            <div id="printable-invoice" className={`bg-white shadow-xl mx-auto ${printSize === 'A5' ? 'print-a5' : 'print-a4'}`}>
                {/* Structure for Sticky Footer */}
                <div className="invoice-container flex flex-col h-full relative">

                    {/* Header */}
                    <header className="text-center mb-2 relative">
                        <div className="absolute top-0 right-0 text-xs" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.5px' }}>Mob: +91-9897452528</div>
                        <img src="/assets/Logo.png" alt="Prakash Jewellers" className="mx-auto w-24 mb-1" />
                        <p className="text-gray-600 text-sm">Near Thakur Dwara Mandir, Main Market, Deoband</p>
                    </header>



                    {/* Content Body (Grows to push footer down) */}
                    <div className="flex-grow">

                        {/* Customer Info */}
                        <div className="p-4 mb-4 border-y border-gray-400">
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                <div>
                                    <label className="font-bold font-serif">Customer:</label>
                                    <input
                                        type="text"
                                        value={custName}
                                        onChange={(e) => setCustName(e.target.value)}
                                        className="w-full border-b border-gray-300 bg-transparent p-1 focus:outline-none focus:border-gray-500"
                                    />
                                </div>
                                <div className="text-right">
                                    <p><span className="font-bold font-serif">Date:</span> {date}</p>
                                    <div className="flex justify-end items-center gap-2">
                                        <span className="font-bold font-serif">Estimate No:</span>
                                        <input
                                            type="text"
                                            value={estNo}
                                            onChange={(e) => setEstNo(e.target.value)}
                                            className="w-24 text-right bg-transparent focus:outline-none border-b border-transparent focus:border-gray-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 text-xs text-gray-600 no-print">
                                <div className="flex items-center gap-2">
                                    <label>Gold Rate (₹/10g):</label>
                                    <input
                                        type="number"
                                        value={goldRate}
                                        onChange={(e) => setGoldRate(e.target.value)}
                                        className="w-20 border-b border-gray-300 bg-transparent p-1 focus:outline-none focus:border-gray-500"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label>Silver Rate (₹/10g):</label>
                                    <input
                                        type="number"
                                        value={silverRate}
                                        onChange={(e) => setSilverRate(e.target.value)}
                                        className="w-20 border-b border-gray-300 bg-transparent p-1 focus:outline-none focus:border-gray-500"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Main Items Table */}

                        <table className="w-full border-collapse border-2 border-gray-400 mb-2">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-sm">Item</th>
                                    <th className="border p-2 text-sm">Description</th>
                                    <th className="border p-2 text-sm">Weight (g)</th>
                                    <th className="border p-2 text-sm">Rate</th>
                                    <th className="border p-2 text-sm">Misc</th>
                                    <th className="border p-2 text-sm">Amount (₹)</th>
                                    <th className="border p-2 text-sm w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {mainRows.map((row, idx) => (
                                    <tr key={row.id}>
                                        <td className="border p-1 text-center text-gray-400">{idx + 1}</td>
                                        <td className="border p-1">
                                            <input
                                                type="text"
                                                value={row.desc}
                                                onChange={(e) => updateMainRow(row.id, 'desc', e.target.value)}
                                                className="w-full bg-transparent text-left"
                                                placeholder="Item Description"
                                            />
                                        </td>
                                        <td className="border p-1">
                                            <input
                                                type="number"
                                                value={row.wt}
                                                onChange={(e) => updateMainRow(row.id, 'wt', e.target.value)}
                                                className="w-full bg-transparent text-center"
                                            />
                                        </td>
                                        <td className="border p-1">
                                            <input
                                                type="number"
                                                value={row.rate}
                                                onChange={(e) => updateMainRow(row.id, 'rate', e.target.value)}
                                                className="w-full bg-transparent text-center"
                                            />
                                        </td>
                                        <td className="border p-1">
                                            <input
                                                type="number"
                                                value={row.misc}
                                                onChange={(e) => updateMainRow(row.id, 'misc', e.target.value)}
                                                className="w-full bg-transparent text-center"
                                            />
                                        </td>
                                        <td className="border p-1">
                                            <input
                                                type="number"
                                                value={row.amt}
                                                onChange={(e) => updateMainRow(row.id, 'amt', e.target.value)}
                                                className="w-full bg-transparent text-center font-semibold"
                                            />
                                        </td>
                                        <td className="border p-1 text-center">
                                            <button onClick={() => deleteMainRow(row.id)} className="text-red-500 hover:text-red-700">✕</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={addMainRow} className="w-full border border-dashed border-gray-300 py-2 text-gray-500 hover:border-gray-500 hover:text-gray-600 mb-4">
                            + Add Item Row
                        </button>

                        {/* Old Items - only show in print if items exist */}
                        <div className={!hasOldItems ? 'no-print-old' : ''}>
                            <div className="text-sm font-bold font-serif mb-2 mt-4">Old Items Return</div>
                            <table className="w-full border-collapse border-2 border-gray-400 mb-2">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border p-2 text-sm">Description</th>
                                        <th className="border p-2 text-sm">Weight (g)</th>
                                        <th className="border p-2 text-sm">Purity %</th>
                                        <th className="border p-2 text-sm">Rate</th>
                                        <th className="border p-2 text-sm">Value (₹)</th>
                                        <th className="border p-2 text-sm w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {oldRows.map((row) => (
                                        <tr key={row.id}>
                                            <td className="border p-1">
                                                <input
                                                    type="text"
                                                    value={row.desc}
                                                    onChange={(e) => updateOldRow(row.id, 'desc', e.target.value)}
                                                    className="w-full bg-transparent text-left"
                                                    placeholder="Old Item"
                                                />
                                            </td>
                                            <td className="border p-1">
                                                <input
                                                    type="number"
                                                    value={row.wt}
                                                    onChange={(e) => updateOldRow(row.id, 'wt', e.target.value)}
                                                    className="w-full bg-transparent text-center"
                                                />
                                            </td>
                                            <td className="border p-1">
                                                <input
                                                    type="number"
                                                    value={row.purity}
                                                    onChange={(e) => updateOldRow(row.id, 'purity', e.target.value)}
                                                    className="w-full bg-transparent text-center"
                                                />
                                            </td>
                                            <td className="border p-1">
                                                <input
                                                    type="number"
                                                    value={row.rate}
                                                    onChange={(e) => updateOldRow(row.id, 'rate', e.target.value)}
                                                    className="w-full bg-transparent text-center"
                                                />
                                            </td>
                                            <td className="border p-1">
                                                <input
                                                    type="number"
                                                    value={row.val}
                                                    onChange={(e) => updateOldRow(row.id, 'val', e.target.value)}
                                                    className="w-full bg-transparent text-center font-semibold text-red-600"
                                                />
                                            </td>
                                            <td className="border p-1 text-center">
                                                <button onClick={() => deleteOldRow(row.id)} className="text-red-500 hover:text-red-700">✕</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button onClick={addOldRow} className="w-full border border-dashed border-gray-300 py-2 text-gray-400 hover:border-gray-500 hover:text-gray-600 mb-4">
                                + Add Old Gold Row
                            </button>
                        </div> {/* End old items conditional wrapper */}

                        {/* Gold Rate Display - Print Only */}
                        {goldRate && (
                            <div className="print-only text-sm text-right mb-2">
                                Gold: ₹{goldRate}/10g
                            </div>
                        )}

                        {/* Narration Section */}
                        <div className="mb-4">
                            <label className="font-bold font-serif">Narration:</label>
                            <textarea
                                value={narration}
                                onChange={(e) => setNarration(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 mt-1 text-sm no-print"
                                placeholder="Enter remarks or special instructions..."
                                rows={2}
                            />
                            {narration && (
                                <div className="print-only text-sm mt-1">
                                    <span className="font-bold">Narration:</span> {narration}
                                </div>
                            )}
                        </div>

                    </div> {/* End of flex-grow content */}

                    {/* Footer Section (Sticks to bottom) */}
                    <div className="mt-auto pt-2 footer-section">
                        {/* To Be Paid Box */}
                        <div className="flex justify-end mb-3">
                            <div style={{ minWidth: '260px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #ccc', fontSize: '13px' }}>
                                    <span>Subtotal</span>
                                    <span>₹{formatCurrency(subtotal)}</span>
                                </div>
                                {oldTotal > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', borderBottom: '1px solid #ccc', fontSize: '13px' }}>
                                        <span>Less: Old Return</span>
                                        <span>- ₹{formatCurrency(oldTotal)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', fontWeight: 'bold', fontSize: '16px', borderTop: '2px solid #000', borderBottom: '2px solid #000', background: '#f5f5f5' }}>
                                    <span>To Be Paid</span>
                                    <span>₹{formatCurrency(grandTotal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Amount in Words */}
                        <div style={{ textAlign: 'right', fontSize: '11px', fontStyle: 'italic', marginBottom: '6px' }}>
                            {numberToWords(Math.round(grandTotal))} rupees only
                        </div>

                        {/* Terms - Moved up for visibility */}
                        <div className="border-t-2 border-dashed border-gray-400 pt-1 text-xs mb-2">
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>सामान बदलने की सुविधा केवल 3 दिनों तक ही उपलब्ध है।</li>
                                <li>इसके बाद वापसी केवल 85% मूल्य पर स्वीकार की जाएगी।</li>
                                <li>लोंग एवं छोटी बाली 75% की ही आती है।</li>
                            </ul>
                        </div>

                        {/* QR Code + Rates + Signature Row */}
                        <div className="flex justify-between items-end" style={{ marginBottom: '6px' }}>
                            {/* QR Code */}
                            <div style={{ textAlign: 'center' }}>
                                <QRCodeSVG
                                    value="https://www.instagram.com/prakash_jewellers_deoband/"
                                    size={60}
                                    level="M"
                                />
                                <div style={{ fontSize: '9px', marginTop: '2px' }}>Scan for Instagram</div>
                            </div>

                            {/* Rates */}
                            <div style={{ textAlign: 'center', fontSize: '12px' }}>
                                {goldRate && <div>Gold: ₹{goldRate}/10g</div>}
                                {silverRate && <div>Silver: ₹{silverRate}/10g</div>}
                            </div>

                            {/* Authorized Signature */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '140px', borderBottom: '1px solid #000', marginBottom: '4px' }}>&nbsp;</div>
                                <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Authorized Signature</div>
                            </div>
                        </div>



                        {/* Thank you */}
                        <div className="text-center mt-1 py-1 font-serif text-sm">
                            Thank you for visiting 🙏
                        </div>
                    </div> {/* End of Footer Section */}

                </div> {/* End of Flex Container */}
            </div>
        </div>
    );
}
