import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { InvoiceData } from '../types/invoice';

// Register fonts (using system fonts for Hindi support)
Font.register({
    family: 'Noto Sans',
    src: 'https://fonts.gstatic.com/s/notosans/v28/o-0IIpQlx3QUlC5A4PNr5TRA.woff2'
});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        backgroundColor: '#fff',
        border: '3pt double #c5a065',
    },
    header: {
        textAlign: 'center',
        marginBottom: 15,
    },
    logo: {
        width: 80,
        alignSelf: 'center',
        marginBottom: 5,
    },
    brandName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#c5a065',
        letterSpacing: 1,
    },
    address: {
        fontSize: 9,
        color: '#444',
        marginTop: 5,
    },
    contact: {
        position: 'absolute',
        top: 15,
        right: 15,
        fontSize: 9,
        fontWeight: 'bold',
    },
    divider: {
        borderBottom: '1pt solid #e0cda8',
        marginVertical: 10,
        textAlign: 'center',
    },
    dividerText: {
        fontSize: 12,
        color: '#c5a065',
        textAlign: 'center',
        marginBottom: 5,
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#fdfaf5',
        padding: 10,
        borderTop: '1pt solid #c5a065',
        borderBottom: '1pt solid #c5a065',
        marginBottom: 15,
    },
    infoLabel: {
        fontWeight: 'bold',
        fontSize: 10,
    },
    sectionTitle: {
        backgroundColor: '#efebe4',
        padding: '5 10',
        fontWeight: 'bold',
        fontSize: 11,
        borderLeft: '4pt solid #c5a065',
        marginBottom: 8,
    },
    sectionTitleRed: {
        backgroundColor: '#fff1f1',
        padding: '5 10',
        fontWeight: 'bold',
        fontSize: 11,
        borderLeft: '4pt solid #e74c3c',
        marginBottom: 8,
        marginTop: 15,
    },
    table: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#c5a065',
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f7e7ce',
        borderBottom: '1pt solid #c5a065',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '0.5pt solid #d4c4a8',
    },
    tableCell: {
        padding: 5,
        textAlign: 'center',
        fontSize: 9,
    },
    tableCellDesc: {
        flex: 3,
        textAlign: 'left',
        paddingLeft: 8,
    },
    tableCellNum: {
        flex: 1,
    },
    tableCellAmt: {
        flex: 1.2,
        fontWeight: 'bold',
    },
    calcSection: {
        alignItems: 'flex-end',
        marginTop: 15,
    },
    calcBox: {
        width: 200,
        borderWidth: 1,
        borderColor: '#c5a065',
        borderRadius: 4,
    },
    calcRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
        borderBottom: '0.5pt solid #eee',
        backgroundColor: '#fdfaf5',
    },
    calcRowTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 8,
        backgroundColor: '#f3e5d0',
        fontWeight: 'bold',
        fontSize: 12,
        borderTop: '2pt solid #000',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 'auto',
        paddingTop: 15,
        borderTop: '1pt dashed #ccc',
    },
    signLine: {
        width: 150,
        borderTop: '1pt solid #777',
        marginBottom: 5,
    },
    terms: {
        backgroundColor: '#f5f1ea',
        padding: 8,
        borderRadius: 4,
        marginTop: 15,
        fontSize: 8,
    },
    footerNote: {
        textAlign: 'center',
        marginTop: 10,
        padding: 6,
        fontSize: 11,
        borderTop: '0.5pt solid #eee',
        borderBottom: '0.5pt solid #eee',
    },
    instaLogo: {
        width: 100,
    },
});

function formatCurrency(num: number): string {
    return '₹ ' + Math.round(num).toLocaleString('en-IN');
}

interface Props {
    data: InvoiceData;
}

export default function InvoicePDF({ data }: Props) {
    const subtotal = data.mainRows.reduce((sum, r) => sum + (parseFloat(r.amt) || 0), 0);
    const oldTotal = data.oldRows.reduce((sum, r) => sum + (parseFloat(r.val) || 0), 0);
    const grandTotal = subtotal - oldTotal;
    const hasOldItems = data.oldRows.length > 0 && data.oldRows.some(r => r.desc || parseFloat(r.val) > 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.contact}>Mob: +91-9897452528</Text>
                    <Image src="/assets/Logo.png" style={styles.logo} />
                    <Text style={styles.address}>Near Thakur Dwara Mandir, Main Market, Deoband</Text>
                </View>

                <Text style={styles.dividerText}>Rough Estimate</Text>
                <View style={styles.divider} />

                {/* Customer Info */}
                <View style={styles.infoGrid}>
                    <View>
                        <Text><Text style={styles.infoLabel}>Customer: </Text>{data.custName || '_______________'}</Text>
                    </View>
                    <View>
                        <Text><Text style={styles.infoLabel}>Date: </Text>{data.date}</Text>
                        <Text><Text style={styles.infoLabel}>Estimate No: </Text>{data.estNo}</Text>
                    </View>
                </View>

                {/* Main Items Table */}
                <Text style={styles.sectionTitle}>Estimate</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCell, { flex: 0.5 }]}>#</Text>
                        <Text style={[styles.tableCell, styles.tableCellDesc]}>Description</Text>
                        <Text style={[styles.tableCell, styles.tableCellNum]}>Weight (g)</Text>
                        <Text style={[styles.tableCell, styles.tableCellNum]}>Rate</Text>
                        <Text style={[styles.tableCell, styles.tableCellNum]}>Misc</Text>
                        <Text style={[styles.tableCell, styles.tableCellAmt]}>Amount (₹)</Text>
                    </View>
                    {data.mainRows.filter(r => r.desc || r.amt).map((row, idx) => (
                        <View style={styles.tableRow} key={idx}>
                            <Text style={[styles.tableCell, { flex: 0.5 }]}>{idx + 1}</Text>
                            <Text style={[styles.tableCell, styles.tableCellDesc]}>{row.desc}</Text>
                            <Text style={[styles.tableCell, styles.tableCellNum]}>{row.wt}</Text>
                            <Text style={[styles.tableCell, styles.tableCellNum]}>{row.rate}</Text>
                            <Text style={[styles.tableCell, styles.tableCellNum]}>{row.misc}</Text>
                            <Text style={[styles.tableCell, styles.tableCellAmt]}>{formatCurrency(parseFloat(row.amt) || 0)}</Text>
                        </View>
                    ))}
                </View>

                {/* Old Items Table (only if has items) */}
                {hasOldItems && (
                    <>
                        <Text style={styles.sectionTitleRed}>Old Items Deduction</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableCell, styles.tableCellDesc]}>Description</Text>
                                <Text style={[styles.tableCell, styles.tableCellNum]}>Weight (g)</Text>
                                <Text style={[styles.tableCell, styles.tableCellNum]}>Purity %</Text>
                                <Text style={[styles.tableCell, styles.tableCellNum]}>Rate</Text>
                                <Text style={[styles.tableCell, styles.tableCellAmt]}>Value (₹)</Text>
                            </View>
                            {data.oldRows.filter(r => r.desc || r.val).map((row, idx) => (
                                <View style={styles.tableRow} key={idx}>
                                    <Text style={[styles.tableCell, styles.tableCellDesc]}>{row.desc}</Text>
                                    <Text style={[styles.tableCell, styles.tableCellNum]}>{row.wt}</Text>
                                    <Text style={[styles.tableCell, styles.tableCellNum]}>{row.purity}</Text>
                                    <Text style={[styles.tableCell, styles.tableCellNum]}>{row.rate}</Text>
                                    <Text style={[styles.tableCell, styles.tableCellAmt]}>{formatCurrency(parseFloat(row.val) || 0)}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Calculations */}
                <View style={styles.calcSection}>
                    <View style={styles.calcBox}>
                        <View style={styles.calcRow}>
                            <Text>Subtotal</Text>
                            <Text>{formatCurrency(subtotal)}</Text>
                        </View>
                        {hasOldItems && (
                            <View style={styles.calcRow}>
                                <Text>Old Items Deduction</Text>
                                <Text>{formatCurrency(oldTotal)}</Text>
                            </View>
                        )}
                        <View style={styles.calcRowTotal}>
                            <Text>Total</Text>
                            <Text>{formatCurrency(grandTotal)}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Image src="/assets/Insta_page_logo.png" style={styles.instaLogo} />
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={styles.signLine} />
                        <Text>Authorized Signature</Text>
                    </View>
                </View>

                {/* Terms */}
                <View style={styles.terms}>
                    <Text>• सामान बदलने की सुविधा केवल 3 दिनों तक ही उपलब्ध है।</Text>
                    <Text>• इसके बाद वापसी केवल 85% मूल्य पर स्वीकार की जाएगी।</Text>
                    <Text>• लोंग एवं छोटी बाली 75% की ही आती है।</Text>
                </View>

                <Text style={styles.footerNote}>Thank you for visiting 🙏</Text>
            </Page>
        </Document>
    );
}
