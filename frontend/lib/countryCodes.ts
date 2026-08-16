// International calling codes, keyed by the country names in lib/countries.ts.
export const COUNTRY_CALLING_CODES: Record<string, string> = {
  Nepal: "+977",
  Afghanistan: "+93",
  Albania: "+355",
  Algeria: "+213",
  Argentina: "+54",
  Australia: "+61",
  Austria: "+43",
  Bangladesh: "+880",
  Belgium: "+32",
  Bhutan: "+975",
  Brazil: "+55",
  Canada: "+1",
  China: "+86",
  Denmark: "+45",
  Egypt: "+20",
  Finland: "+358",
  France: "+33",
  Germany: "+49",
  Greece: "+30",
  "Hong Kong": "+852",
  Hungary: "+36",
  Iceland: "+354",
  India: "+91",
  Indonesia: "+62",
  Ireland: "+353",
  Israel: "+972",
  Italy: "+39",
  Japan: "+81",
  Kuwait: "+965",
  Malaysia: "+60",
  Maldives: "+960",
  Mexico: "+52",
  Myanmar: "+95",
  Netherlands: "+31",
  "New Zealand": "+64",
  Norway: "+47",
  Oman: "+968",
  Pakistan: "+92",
  Philippines: "+63",
  Poland: "+48",
  Portugal: "+351",
  Qatar: "+974",
  Russia: "+7",
  "Saudi Arabia": "+966",
  Singapore: "+65",
  "South Africa": "+27",
  "South Korea": "+82",
  Spain: "+34",
  "Sri Lanka": "+94",
  Sweden: "+46",
  Switzerland: "+41",
  Thailand: "+66",
  Turkey: "+90",
  Ukraine: "+380",
  "United Arab Emirates": "+971",
  "United Kingdom": "+44",
  "United States": "+1",
  Vietnam: "+84",
};

// Dropdown options, sorted by code with Nepal pinned first — de-duplicated
// since a couple of codes (e.g. +1) are shared by more than one country.
export const COUNTRY_CODES: string[] = [
  "+977",
  ...Array.from(new Set(Object.values(COUNTRY_CALLING_CODES)))
    .filter((code) => code !== "+977")
    .sort((a, b) => Number(a.replace("+", "")) - Number(b.replace("+", ""))),
];

export function getCallingCodeForCountry(country: string): string {
  return COUNTRY_CALLING_CODES[country] ?? "+977";
}
