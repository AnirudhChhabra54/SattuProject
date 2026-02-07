// Type definitions for the invoice application

export interface MainRow {
    id: number;
    desc: string;
    wt: string;
    rate: string;
    misc: string;
    amt: string;
}

export interface OldRow {
    id: number;
    desc: string;
    wt: string;
    purity: string;
    rate: string;
    val: string;
}

export interface InvoiceData {
    custName: string;
    estNo: string;
    date: string;
    mainRows: MainRow[];
    oldRows: OldRow[];
}
