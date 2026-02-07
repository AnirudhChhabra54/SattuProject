import { useState, useCallback } from 'react';
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

function formatCurrency(num: number): string {
    return Math.round(num).toLocaleString('en-IN');
}

export default function InvoiceForm() {
    const [custName, setCustName] = useState('');
    const [estNo] = useState(getNextEstimateNumber);
    const [date] = useState(getTodayString);
    const [printSize, setPrintSize] = useState<'A4' | 'A5'>('A4');

    const [mainRows, setMainRows] = useState<MainRow[]>([
        { id: Date.now(), desc: '', wt: '', rate: '', misc: '', amt: '' }
    ]);

    const [oldRows, setOldRows] = useState<OldRow[]>([
        { id: Date.now() + 1, desc: '', wt: '', purity: '100', rate: '', val: '' }
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
        setOldRows(prev => [...prev, { id: Date.now(), desc: '', wt: '', purity: '100', rate: '', val: '' }]);
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

    // Check if old items have content
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
                <button
                    onClick={handlePrint}
                    className="bg-amber-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-amber-700 transition flex items-center gap-2"
                >
                    🖨️ Print Invoice
                </button>
            </div>

            {/* Invoice Form */}
            <div id="printable-invoice" className={`bg-white shadow-xl mx-auto ${printSize === 'A5' ? 'print-a5' : 'print-a4'}`}>
                {/* Structure for Sticky Footer */}
                <div className="invoice-container flex flex-col h-full relative">

                    {/* Header */}
                    <header className="text-center mb-2 relative">
                        <div className="absolute top-0 right-0 text-sm font-bold">Mob: +91-9897452528</div>
                        <img src="/assets/Logo.png" alt="Prakash Jewellers" className="mx-auto w-24 mb-1" />
                        <p className="text-gray-600 text-sm">Near Thakur Dwara Mandir, Main Market, Deoband</p>
                    </header>

                    <div className="text-center text-amber-600 font-serif text-lg border-y border-amber-300 py-1 mb-2">
                        Rough Estimate
                    </div>

                    {/* Content Body (Grows to push footer down) */}
                    <div className="flex-grow">

                        {/* Customer Info */}
                        <div className="grid grid-cols-2 gap-4 bg-amber-50 p-4 mb-6 border-y border-amber-500">
                            <div>
                                <label className="font-bold font-serif">Customer:</label>
                                <input
                                    type="text"
                                    value={custName}
                                    onChange={(e) => setCustName(e.target.value)}
                                    className="w-full border-b border-gray-300 bg-transparent p-1 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            <div className="text-right">
                                <p><span className="font-bold font-serif">Date:</span> {date}</p>
                                <p><span className="font-bold font-serif">Estimate No:</span> {estNo}</p>
                            </div>
                        </div>

                        {/* Main Items Table */}
                        <div className="bg-gray-100 px-4 py-2 font-bold font-serif border-l-4 border-amber-500 mb-4">
                            Estimate
                        </div>
                        <table className="w-full border-collapse border-2 border-amber-500 mb-2">
                            <thead>
                                <tr className="bg-amber-100">
                                    <th className="border p-2 text-sm">#</th>
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
                        <button onClick={addMainRow} className="w-full border border-dashed border-gray-300 py-2 text-gray-500 hover:border-amber-500 hover:text-amber-600 mb-6">
                            + Add Item Row
                        </button>

                        {/* Old Items */}
                        <div className="bg-red-50 px-4 py-2 font-bold font-serif border-l-4 border-red-500 mb-4">
                            Old Items Deduction
                        </div>
                        <table className="w-full border-collapse border-2 border-amber-500 mb-2">
                            <thead>
                                <tr className="bg-amber-100">
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
                        <button onClick={addOldRow} className="w-full border border-dashed border-red-200 py-2 text-red-400 hover:border-red-400 hover:text-red-500 mb-6">
                            + Add Old Gold Row
                        </button>

                    </div> {/* End of flex-grow content */}

                    {/* Footer Section (Sticks to bottom) */}
                    <div className="mt-auto pt-2">
                        {/* Calculations */}
                        <div className="flex justify-end mb-2">
                            <div className="w-64 border border-amber-500 rounded overflow-hidden text-sm">
                                <div className="flex justify-between p-2 bg-amber-50">
                                    <span>Subtotal</span>
                                    <span>₹ {formatCurrency(subtotal)}</span>
                                </div>
                                {hasOldItems && (
                                    <div className="flex justify-between p-2 border-t">
                                        <span>Old Items Deduction</span>
                                        <span>₹ {formatCurrency(oldTotal)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between p-2 bg-gradient-to-r from-amber-100 to-amber-50 font-bold font-serif text-base border-t-2 border-black">
                                    <span>Total</span>
                                    <span>₹ {formatCurrency(grandTotal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Auth & Terms */}
                        <div className="flex justify-between items-end pt-2 border-t border-dashed border-gray-400">
                            <div>
                                <img src="/assets/Insta_page_logo.png" alt="Instagram" className="w-24" />
                            </div>
                            <div className="text-right">
                                <div className="w-40 border-t border-gray-600 mb-1 inline-block"></div>
                                <p className="font-serif font-semibold text-sm">Authorized Signature</p>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="bg-amber-50 p-2 rounded mt-2 text-xs">
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>सामान बदलने की सुविधा केवल 3 दिनों तक ही उपलब्ध है।</li>
                                <li>इसके बाद वापसी केवल 85% मूल्य पर स्वीकार की जाएगी।</li>
                                <li>लोंग एवं छोटी बाली 75% की ही आती है।</li>
                            </ul>
                        </div>

                        <div className="text-center mt-2 py-1 border-t border-b border-gray-200 font-serif text-base">
                            Thank you for visiting 🙏
                        </div>
                    </div> {/* End of Footer Section */}

                </div> {/* End of Flex Container */}
            </div>
        </div>
    );
}
