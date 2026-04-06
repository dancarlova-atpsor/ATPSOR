export type CompanyDocumentType = "company_license";

export type VehicleDocumentType =
  | "vehicle_registration_itp"
  | "certified_copy"
  | "passenger_luggage_insurance"
  | "rca_insurance";

export interface CompanyDocument {
  id: string;
  company_id: string;
  document_type: CompanyDocumentType;
  file_url: string;
  file_name: string;
  issue_date: string | null;
  expiry_date: string;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  company_id: string;
  document_type: VehicleDocumentType;
  file_url: string;
  file_name: string;
  issue_date: string | null;
  expiry_date: string;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const COMPANY_DOCUMENT_LABELS: Record<CompanyDocumentType, { ro: string; en: string }> = {
  company_license: {
    ro: "Licență transport",
    en: "Transport License",
  },
};

export const VEHICLE_DOCUMENT_LABELS: Record<VehicleDocumentType, { ro: string; en: string }> = {
  vehicle_registration_itp: {
    ro: "Talon cu ITP valabil",
    en: "Vehicle Registration with valid MOT",
  },
  certified_copy: {
    ro: "Copie conformă",
    en: "Certified Copy",
  },
  passenger_luggage_insurance: {
    ro: "Asigurare bagaje și călători",
    en: "Passenger & Luggage Insurance",
  },
  rca_insurance: {
    ro: "Asigurare RCA",
    en: "Mandatory Liability Insurance (RCA)",
  },
};

export function getRequiredVehicleDocuments(seats: number): VehicleDocumentType[] {
  const docs: VehicleDocumentType[] = [
    "vehicle_registration_itp",
    "rca_insurance",
  ];

  // Certified copy and passenger/luggage insurance required only for vehicles with more than 9 seats (not for ride sharing 3+1 to 8+1)
  if (seats > 9) {
    docs.push("certified_copy");
    docs.push("passenger_luggage_insurance");
  }

  return docs;
}

/** Minimum billable km per day */
export const MIN_KM_PER_DAY = 200;

/** Calculate billable km for a day (minimum 200 km/day) */
export function getBillableKm(actualKm: number): number {
  return Math.max(actualKm, MIN_KM_PER_DAY);
}

/** Calculate total billable km for all days (each day minimum 200 km) */
export function getTotalBillableKm(dailyKms: number[]): number {
  return dailyKms.reduce((sum, km) => sum + getBillableKm(km), 0);
}
