/**
 * BAS Kontoplan 2026 — Standard Swedish Chart of Accounts
 *
 * Organized by account class:
 *   1xxx - Tillgangar (Assets)
 *   2xxx - Eget kapital och skulder (Equity & Liabilities)
 *   3xxx - Rorelseinttakter (Operating Revenue)
 *   4xxx - Varuinkop (Cost of Goods)
 *   5xxx - Ovriga externa kostnader (Other External Costs)
 *   6xxx - Ovriga externa kostnader forts. (Other External Costs cont.)
 *   7xxx - Personalkostnader (Personnel Costs)
 *   8xxx - Finansiella poster (Financial Items)
 */

export interface BASAccount {
  accountNumber: string;
  name: string;
  nameEn: string;
  vatCode?: "25" | "12" | "6" | "0";
}

export const basKontoplan: BASAccount[] = [
  // ═══════════════════════════════════════════
  // 1xxx — TILLGANGAR (Assets)
  // ═══════════════════════════════════════════

  // 10xx - Immateriella anlaggningstillgangar
  { accountNumber: "1010", name: "Utvecklingsutgifter", nameEn: "Development costs" },
  { accountNumber: "1020", name: "Koncessioner", nameEn: "Concessions" },
  { accountNumber: "1030", name: "Patent", nameEn: "Patents" },
  { accountNumber: "1050", name: "Goodwill", nameEn: "Goodwill" },
  { accountNumber: "1070", name: "Ovriga immateriella tillgangar", nameEn: "Other intangible assets" },

  // 11xx - Byggnader och mark
  { accountNumber: "1110", name: "Byggnader", nameEn: "Buildings" },
  { accountNumber: "1130", name: "Mark", nameEn: "Land" },
  { accountNumber: "1150", name: "Markanlaggningar", nameEn: "Land improvements" },

  // 12xx - Maskiner och inventarier
  { accountNumber: "1210", name: "Maskiner och andra tekniska anlaggningar", nameEn: "Machinery" },
  { accountNumber: "1220", name: "Inventarier och verktyg", nameEn: "Equipment and tools" },
  { accountNumber: "1230", name: "Installationer", nameEn: "Installations" },
  { accountNumber: "1240", name: "Bilar och andra transportmedel", nameEn: "Vehicles" },
  { accountNumber: "1250", name: "Datorer", nameEn: "Computers" },
  { accountNumber: "1290", name: "Ovriga inventarier", nameEn: "Other equipment" },

  // 13xx - Finansiella anlaggningstillgangar
  { accountNumber: "1310", name: "Andelar i koncernforetag", nameEn: "Shares in group companies" },
  { accountNumber: "1320", name: "Langtidiga fordringar koncernforetag", nameEn: "Long-term receivables group" },
  { accountNumber: "1350", name: "Andelar i intresseforetag", nameEn: "Shares in associated companies" },
  { accountNumber: "1380", name: "Andra langsiktiga vaerdepappersinnehav", nameEn: "Other long-term securities" },
  { accountNumber: "1390", name: "Ovriga finansiella anlaggningstillgangar", nameEn: "Other financial fixed assets" },

  // 14xx - Lager
  { accountNumber: "1400", name: "Lager", nameEn: "Inventory" },
  { accountNumber: "1410", name: "Lager av ravaror", nameEn: "Raw materials inventory" },
  { accountNumber: "1420", name: "Lager av halvfabrikat", nameEn: "Work in progress inventory" },
  { accountNumber: "1460", name: "Lager av fardigvaror", nameEn: "Finished goods inventory" },
  { accountNumber: "1480", name: "Pagende arbeten", nameEn: "Work in progress" },

  // 15xx - Kundfordringar
  { accountNumber: "1510", name: "Kundfordringar", nameEn: "Accounts receivable" },
  { accountNumber: "1519", name: "Nedskrivning av kundfordringar", nameEn: "Provision for bad debts" },

  // 16xx - Ovriga kortfristiga fordringar
  { accountNumber: "1610", name: "Fordringar hos anstallda", nameEn: "Receivables from employees" },
  { accountNumber: "1630", name: "Skattefordringar", nameEn: "Tax receivables" },
  { accountNumber: "1650", name: "Momsfordran", nameEn: "VAT receivable" },
  { accountNumber: "1680", name: "Ovriga kortfristiga fordringar", nameEn: "Other short-term receivables" },
  { accountNumber: "1690", name: "Upparbetad ej fakturerad intakt", nameEn: "Accrued revenue" },

  // 17xx - Forutbetalda kostnader
  { accountNumber: "1710", name: "Forutbetalda hyror", nameEn: "Prepaid rent" },
  { accountNumber: "1720", name: "Forutbetalda forsakringar", nameEn: "Prepaid insurance" },
  { accountNumber: "1730", name: "Forutbetalda raentekostnader", nameEn: "Prepaid interest" },
  { accountNumber: "1790", name: "Ovriga forutbetalda kostnader", nameEn: "Other prepaid expenses" },

  // 19xx - Kassa och bank
  { accountNumber: "1910", name: "Kassa", nameEn: "Cash" },
  { accountNumber: "1920", name: "PlusGiro", nameEn: "PlusGiro" },
  { accountNumber: "1930", name: "Foretagskonto / checkrakningskonto", nameEn: "Business bank account" },
  { accountNumber: "1940", name: "Ovriga bankkonton", nameEn: "Other bank accounts" },
  { accountNumber: "1950", name: "Bankcertifikat", nameEn: "Bank certificates" },

  // ═══════════════════════════════════════════
  // 2xxx — EGET KAPITAL OCH SKULDER (Equity & Liabilities)
  // ═══════════════════════════════════════════

  // 20xx - Eget kapital
  { accountNumber: "2010", name: "Eget kapital, enskild firma", nameEn: "Owner's equity, sole proprietor" },
  { accountNumber: "2013", name: "Ovriga egna uttag", nameEn: "Owner's drawings" },
  { accountNumber: "2018", name: "Ovriga egna insattningar", nameEn: "Owner's contributions" },
  { accountNumber: "2019", name: "Arets resultat, enskild firma", nameEn: "Net income, sole proprietor" },
  { accountNumber: "2081", name: "Aktiekapital", nameEn: "Share capital" },
  { accountNumber: "2085", name: "Uppskrivningsfond", nameEn: "Revaluation reserve" },
  { accountNumber: "2086", name: "Reservfond", nameEn: "Legal reserve" },
  { accountNumber: "2090", name: "Fritt eget kapital", nameEn: "Retained earnings" },
  { accountNumber: "2091", name: "Balanserad vinst/forlust", nameEn: "Retained profit/loss" },
  { accountNumber: "2098", name: "Vinst/forlust foregaende ar", nameEn: "Prior year profit/loss" },
  { accountNumber: "2099", name: "Arets resultat", nameEn: "Current year net income" },

  // 21xx - Obeskattade reserver
  { accountNumber: "2110", name: "Periodiseringsfonder", nameEn: "Tax allocation reserves" },
  { accountNumber: "2150", name: "Ackumulerade overavskrivningar", nameEn: "Accumulated excess depreciation" },

  // 22xx - Avsattningar
  { accountNumber: "2210", name: "Avsattningar for pensioner", nameEn: "Pension provisions" },
  { accountNumber: "2250", name: "Ovriga avsattningar", nameEn: "Other provisions" },

  // 23xx - Langfristiga skulder
  { accountNumber: "2310", name: "Obligationslan", nameEn: "Bond loans" },
  { accountNumber: "2330", name: "Checkrakningskredit", nameEn: "Overdraft facility" },
  { accountNumber: "2350", name: "Ovriga skulder till kreditinstitut", nameEn: "Other bank loans" },
  { accountNumber: "2390", name: "Ovriga langfristiga skulder", nameEn: "Other long-term liabilities" },

  // 24xx - Leverantorsskulder
  { accountNumber: "2440", name: "Leverantorsskulder", nameEn: "Accounts payable" },

  // 25xx - Skatteskulder
  { accountNumber: "2510", name: "Skatteskulder", nameEn: "Tax liabilities" },

  // 26xx - Momsskulder
  { accountNumber: "2610", name: "Utgaende moms 25%", nameEn: "Output VAT 25%", vatCode: "25" },
  { accountNumber: "2620", name: "Utgaende moms 12%", nameEn: "Output VAT 12%", vatCode: "12" },
  { accountNumber: "2630", name: "Utgaende moms 6%", nameEn: "Output VAT 6%", vatCode: "6" },
  { accountNumber: "2640", name: "Ingaende moms", nameEn: "Input VAT" },
  { accountNumber: "2641", name: "Ingaende moms 25%", nameEn: "Input VAT 25%", vatCode: "25" },
  { accountNumber: "2642", name: "Ingaende moms 12%", nameEn: "Input VAT 12%", vatCode: "12" },
  { accountNumber: "2643", name: "Ingaende moms 6%", nameEn: "Input VAT 6%", vatCode: "6" },
  { accountNumber: "2650", name: "Momsredovisning", nameEn: "VAT settlement" },

  // 27xx - Personalens skatter och avgifter
  { accountNumber: "2710", name: "Personalskatter", nameEn: "Employee taxes withheld" },
  { accountNumber: "2730", name: "Lagstadgade sociala avgifter", nameEn: "Social security contributions" },
  { accountNumber: "2731", name: "Avrakning sociala avgifter", nameEn: "Social security settlement" },
  { accountNumber: "2740", name: "Tjanstepensionspremier", nameEn: "Pension premiums payable" },

  // 28xx - Ovriga kortfristiga skulder
  { accountNumber: "2890", name: "Ovriga kortfristiga skulder", nameEn: "Other short-term liabilities" },

  // 29xx - Upplupna kostnader
  { accountNumber: "2910", name: "Upplupna loner", nameEn: "Accrued wages" },
  { accountNumber: "2920", name: "Upplupna semesterloner", nameEn: "Accrued vacation pay" },
  { accountNumber: "2940", name: "Upplupna sociala avgifter", nameEn: "Accrued social security" },
  { accountNumber: "2960", name: "Upplupna raentekostnader", nameEn: "Accrued interest expenses" },
  { accountNumber: "2990", name: "Ovriga upplupna kostnader", nameEn: "Other accrued expenses" },
  { accountNumber: "2999", name: "Forutbetalda intakter", nameEn: "Deferred revenue" },

  // ═══════════════════════════════════════════
  // 3xxx — RORELSEINTTAKTER (Operating Revenue)
  // ═══════════════════════════════════════════

  { accountNumber: "3000", name: "Forsaljning", nameEn: "Sales revenue" },
  { accountNumber: "3001", name: "Forsaljning 25% moms", nameEn: "Sales 25% VAT", vatCode: "25" },
  { accountNumber: "3002", name: "Forsaljning 12% moms", nameEn: "Sales 12% VAT", vatCode: "12" },
  { accountNumber: "3003", name: "Forsaljning 6% moms", nameEn: "Sales 6% VAT", vatCode: "6" },
  { accountNumber: "3004", name: "Forsaljning momsfri", nameEn: "Sales VAT exempt", vatCode: "0" },
  { accountNumber: "3100", name: "Forsaljning varor", nameEn: "Sales of goods", vatCode: "25" },
  { accountNumber: "3200", name: "Forsaljning tjanster", nameEn: "Sales of services", vatCode: "25" },
  { accountNumber: "3300", name: "Forsaljning varor utomlands", nameEn: "Export sales of goods", vatCode: "0" },
  { accountNumber: "3400", name: "Forsaljning tjanster utomlands", nameEn: "Export sales of services", vatCode: "0" },
  { accountNumber: "3500", name: "Fakturerade kostnader", nameEn: "Invoiced costs" },
  { accountNumber: "3600", name: "Rorelseintakter sidoverksamhet", nameEn: "Other operating revenue" },
  { accountNumber: "3700", name: "Intakter fakturerade till koncern", nameEn: "Intra-group revenue" },
  { accountNumber: "3900", name: "Ovriga rorelseinttakter", nameEn: "Other operating revenue" },
  { accountNumber: "3910", name: "Hyresintakter", nameEn: "Rental income" },
  { accountNumber: "3960", name: "Valutakursvinster", nameEn: "Foreign exchange gains" },
  { accountNumber: "3990", name: "Ovriga ersattningar och intakter", nameEn: "Other income" },

  // ═══════════════════════════════════════════
  // 4xxx — VARUINKOP / MATERIAL (Cost of Goods Sold)
  // ═══════════════════════════════════════════

  { accountNumber: "4000", name: "Material och varuinkop", nameEn: "Materials and goods purchased", vatCode: "25" },
  { accountNumber: "4010", name: "Inkop material och varor", nameEn: "Purchases of materials", vatCode: "25" },
  { accountNumber: "4100", name: "Inkop varor", nameEn: "Purchase of goods", vatCode: "25" },
  { accountNumber: "4200", name: "Inkop varor utomlands", nameEn: "Import purchases of goods" },
  { accountNumber: "4500", name: "Ovriga varuinkop", nameEn: "Other purchases" },
  { accountNumber: "4600", name: "Legoarbeten och underentreprenader", nameEn: "Subcontracting" },
  { accountNumber: "4900", name: "Forandring av lager", nameEn: "Change in inventory" },

  // ═══════════════════════════════════════════
  // 5xxx — OVRIGA EXTERNA KOSTNADER (Other External Costs)
  // ═══════════════════════════════════════════

  { accountNumber: "5000", name: "Lokalkostnader", nameEn: "Premises costs" },
  { accountNumber: "5010", name: "Lokalhyra", nameEn: "Rent", vatCode: "25" },
  { accountNumber: "5020", name: "El for lokaler", nameEn: "Electricity", vatCode: "25" },
  { accountNumber: "5030", name: "Varme", nameEn: "Heating", vatCode: "25" },
  { accountNumber: "5040", name: "Vatten och avlopp", nameEn: "Water and sewage", vatCode: "25" },
  { accountNumber: "5050", name: "Lokaltillbehor", nameEn: "Office supplies", vatCode: "25" },
  { accountNumber: "5060", name: "Stadning och renhaallning", nameEn: "Cleaning", vatCode: "25" },
  { accountNumber: "5090", name: "Ovriga lokalkostnader", nameEn: "Other premises costs" },
  { accountNumber: "5100", name: "Fastighetskostnader", nameEn: "Property costs" },
  { accountNumber: "5200", name: "Hyra av anlaggningstillgangar", nameEn: "Leasing costs", vatCode: "25" },
  { accountNumber: "5210", name: "Hyra av maskiner", nameEn: "Machine rental", vatCode: "25" },
  { accountNumber: "5220", name: "Hyra av inventarier", nameEn: "Equipment rental", vatCode: "25" },
  { accountNumber: "5250", name: "Hyra av datorer", nameEn: "Computer rental", vatCode: "25" },
  { accountNumber: "5300", name: "Foerbrukningsinventarier", nameEn: "Consumable equipment", vatCode: "25" },
  { accountNumber: "5400", name: "Forbrukningsinventarier och material", nameEn: "Consumables", vatCode: "25" },
  { accountNumber: "5410", name: "Forbrukningsinventarier", nameEn: "Consumable equipment", vatCode: "25" },
  { accountNumber: "5420", name: "Programvaror", nameEn: "Software", vatCode: "25" },
  { accountNumber: "5460", name: "Forbrukningsmaterial", nameEn: "Consumable materials", vatCode: "25" },
  { accountNumber: "5480", name: "Arbetsklaeder", nameEn: "Work clothing", vatCode: "25" },
  { accountNumber: "5500", name: "Reparation och underhall", nameEn: "Repairs and maintenance", vatCode: "25" },
  { accountNumber: "5600", name: "Transportkostnader", nameEn: "Transport costs" },
  { accountNumber: "5610", name: "Frakter", nameEn: "Freight", vatCode: "25" },
  { accountNumber: "5700", name: "Resekostnader", nameEn: "Travel costs" },
  { accountNumber: "5710", name: "Bilersattningar", nameEn: "Car allowances" },
  { accountNumber: "5800", name: "Resekostnader", nameEn: "Travel expenses" },
  { accountNumber: "5810", name: "Biljetter", nameEn: "Travel tickets", vatCode: "6" },
  { accountNumber: "5830", name: "Kost och logi", nameEn: "Meals and lodging", vatCode: "12" },
  { accountNumber: "5890", name: "Ovriga resekostnader", nameEn: "Other travel costs" },
  { accountNumber: "5900", name: "Reklam och PR", nameEn: "Advertising and PR", vatCode: "25" },
  { accountNumber: "5910", name: "Annonsering", nameEn: "Advertising", vatCode: "25" },
  { accountNumber: "5930", name: "Reklamtrycksaker", nameEn: "Promotional materials", vatCode: "25" },
  { accountNumber: "5940", name: "Utomhusreklam", nameEn: "Outdoor advertising" },

  // ═══════════════════════════════════════════
  // 6xxx — OVRIGA EXTERNA KOSTNADER forts. (Other External Costs cont.)
  // ═══════════════════════════════════════════

  { accountNumber: "6000", name: "Ovriga forsaljningskostnader", nameEn: "Other selling costs" },
  { accountNumber: "6010", name: "Kataloger och prislistor", nameEn: "Catalogs and price lists" },
  { accountNumber: "6040", name: "Representation", nameEn: "Entertainment", vatCode: "0" },
  { accountNumber: "6050", name: "Representation, avdragsgill", nameEn: "Entertainment, deductible" },
  { accountNumber: "6060", name: "Representation, ej avdragsgill", nameEn: "Entertainment, non-deductible" },
  { accountNumber: "6100", name: "Kontorsmaterial", nameEn: "Office supplies", vatCode: "25" },
  { accountNumber: "6110", name: "Kontorsmaterial och trycksaker", nameEn: "Office supplies and printing", vatCode: "25" },
  { accountNumber: "6150", name: "Trycksaker", nameEn: "Printing", vatCode: "25" },
  { accountNumber: "6200", name: "Tele och post", nameEn: "Telecom and postage" },
  { accountNumber: "6210", name: "Telekommunikation", nameEn: "Telecommunications", vatCode: "25" },
  { accountNumber: "6211", name: "Fast telefoni", nameEn: "Landline", vatCode: "25" },
  { accountNumber: "6212", name: "Mobiltelefon", nameEn: "Mobile phone", vatCode: "25" },
  { accountNumber: "6213", name: "Bredband", nameEn: "Broadband", vatCode: "25" },
  { accountNumber: "6230", name: "Datakommunikation", nameEn: "Data communication", vatCode: "25" },
  { accountNumber: "6250", name: "Porto", nameEn: "Postage", vatCode: "0" },
  { accountNumber: "6300", name: "Foretagsforsakringar", nameEn: "Business insurance", vatCode: "0" },
  { accountNumber: "6310", name: "Foretagsforsakringar", nameEn: "Business insurance", vatCode: "0" },
  { accountNumber: "6400", name: "Forvaltningskostnader", nameEn: "Administration costs" },
  { accountNumber: "6410", name: "Styrelsearvoden", nameEn: "Board fees" },
  { accountNumber: "6420", name: "Ersattning till revisorer", nameEn: "Audit fees", vatCode: "25" },
  { accountNumber: "6430", name: "Management fee", nameEn: "Management fees" },
  { accountNumber: "6440", name: "Arbetsgivaravgift styrelsearvoden", nameEn: "Social security on board fees" },
  { accountNumber: "6500", name: "Ovriga externa tjanster", nameEn: "Other external services" },
  { accountNumber: "6530", name: "Redovisningstjanster", nameEn: "Accounting services", vatCode: "25" },
  { accountNumber: "6540", name: "IT-tjanster", nameEn: "IT services", vatCode: "25" },
  { accountNumber: "6550", name: "Konsultarvoden", nameEn: "Consulting fees", vatCode: "25" },
  { accountNumber: "6560", name: "Juridiska tjanster", nameEn: "Legal fees", vatCode: "25" },
  { accountNumber: "6570", name: "Bankkostnader", nameEn: "Bank charges", vatCode: "0" },
  { accountNumber: "6580", name: "Advokat och ratteganskostnader", nameEn: "Legal and court costs" },
  { accountNumber: "6590", name: "Ovriga externa tjanster", nameEn: "Other external services" },
  { accountNumber: "6800", name: "Inhyrd personal", nameEn: "Temporary staff" },
  { accountNumber: "6900", name: "Ovriga externa kostnader", nameEn: "Other external costs" },
  { accountNumber: "6970", name: "Tidningar och tidskrifter", nameEn: "Newspapers and magazines", vatCode: "6" },
  { accountNumber: "6980", name: "Foreningsavgifter", nameEn: "Membership fees", vatCode: "0" },
  { accountNumber: "6981", name: "Foreningsavgifter, avdragsgilla", nameEn: "Deductible membership fees", vatCode: "0" },
  { accountNumber: "6990", name: "Ovriga externa kostnader", nameEn: "Other external costs" },

  // ═══════════════════════════════════════════
  // 7xxx — PERSONALKOSTNADER (Personnel Costs)
  // ═══════════════════════════════════════════

  { accountNumber: "7010", name: "Loner kollektivanstallda", nameEn: "Wages, collectively employed" },
  { accountNumber: "7080", name: "Loner tjansteman", nameEn: "Salaries, salaried employees" },
  { accountNumber: "7082", name: "Sjukloner", nameEn: "Sick pay" },
  { accountNumber: "7090", name: "Foranding semesterloner", nameEn: "Change in vacation accrual" },
  { accountNumber: "7200", name: "Loner foretag/delägare", nameEn: "Owner salary" },
  { accountNumber: "7210", name: "Lon till foretagsledare", nameEn: "CEO salary" },
  { accountNumber: "7220", name: "Lon till VD", nameEn: "Managing director salary" },
  { accountNumber: "7310", name: "Kontanta extraersattningar", nameEn: "Cash bonuses" },
  { accountNumber: "7320", name: "Tantiem till foretagsledare", nameEn: "Bonuses to directors" },
  { accountNumber: "7380", name: "Kostnader for personnybilsformaner", nameEn: "Car benefit costs" },
  { accountNumber: "7385", name: "Ovriga personalbilas kostnader", nameEn: "Other car benefit costs" },
  { accountNumber: "7410", name: "Pensionsforsakringspremier", nameEn: "Pension insurance premiums" },
  { accountNumber: "7510", name: "Arbetsgivaravgifter", nameEn: "Employer social security contributions" },
  { accountNumber: "7519", name: "Sociala avgifter semesterloner", nameEn: "Social security on vacation pay" },
  { accountNumber: "7530", name: "Sarskild loneskatt", nameEn: "Special payroll tax" },
  { accountNumber: "7570", name: "Premieskatt", nameEn: "Premium tax" },
  { accountNumber: "7610", name: "Utbildning", nameEn: "Training", vatCode: "25" },
  { accountNumber: "7620", name: "Sjuk- och halsovaerd", nameEn: "Healthcare", vatCode: "25" },
  { accountNumber: "7630", name: "Personalrepresentation", nameEn: "Staff entertainment" },
  { accountNumber: "7690", name: "Ovriga personalkostnader", nameEn: "Other personnel costs" },
  { accountNumber: "7810", name: "Avskrivningar immateriella tillgangar", nameEn: "Amortization intangible assets" },
  { accountNumber: "7820", name: "Avskrivningar byggnader", nameEn: "Depreciation buildings" },
  { accountNumber: "7830", name: "Avskrivningar maskiner och inventarier", nameEn: "Depreciation equipment" },
  { accountNumber: "7832", name: "Avskrivningar inventarier", nameEn: "Depreciation fixtures" },
  { accountNumber: "7834", name: "Avskrivningar bilar", nameEn: "Depreciation vehicles" },
  { accountNumber: "7835", name: "Avskrivningar datorer", nameEn: "Depreciation computers" },

  // ═══════════════════════════════════════════
  // 8xxx — FINANSIELLA POSTER (Financial Items)
  // ═══════════════════════════════════════════

  { accountNumber: "8010", name: "Resultat forsaljning andelar koncernforetag", nameEn: "P/L on sale of group shares" },
  { accountNumber: "8100", name: "Ranteintakter", nameEn: "Interest income" },
  { accountNumber: "8110", name: "Ranteintakter fran koncernforetag", nameEn: "Interest from group companies" },
  { accountNumber: "8210", name: "Utdelning pa andelar", nameEn: "Dividend income" },
  { accountNumber: "8300", name: "Rantekostnader", nameEn: "Interest expenses" },
  { accountNumber: "8310", name: "Rantekostnader till koncernforetag", nameEn: "Interest to group companies" },
  { accountNumber: "8400", name: "Rantekostnader langfristiga skulder", nameEn: "Interest on long-term debt" },
  { accountNumber: "8410", name: "Rantekostnader kreditinstitut", nameEn: "Interest to banks" },
  { accountNumber: "8420", name: "Rantekostnader leverantorsskulder", nameEn: "Interest on payables" },
  { accountNumber: "8490", name: "Ovriga raentekostnader", nameEn: "Other interest expenses" },
  { accountNumber: "8500", name: "Valutakursdifferenser", nameEn: "Foreign exchange differences" },
  { accountNumber: "8800", name: "Bokslutsdispositioner", nameEn: "Year-end appropriations" },
  { accountNumber: "8810", name: "Forandring periodiseringsfonder", nameEn: "Change in tax allocation reserves" },
  { accountNumber: "8850", name: "Forandring overavskrivningar", nameEn: "Change in excess depreciation" },
  { accountNumber: "8910", name: "Skatt pa arets resultat", nameEn: "Income tax" },
  { accountNumber: "8990", name: "Arets resultat", nameEn: "Net income for the year" },
  { accountNumber: "8999", name: "Arets resultat", nameEn: "Net income" },
];
