export type UserRole = "client" | "transporter" | "admin";

export type VehicleCategory =
  | "ridesharing"
  | "microbuz"
  | "midiautocar"
  | "autocar"
  | "autocar_maxi"
  | "autocar_grand_turismo";

export type RequestStatus =
  | "pending"
  | "active"
  | "fulfilled"
  | "cancelled"
  | "expired";

export type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type BookingStatus =
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type InvoiceType = "transport" | "commission" | "luxuria_commission";
export type InvoiceStatus = "pending" | "issued" | "failed";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  owner_id: string;
  name: string;
  cui: string;
  license_number: string;
  description: string | null;
  address: string;
  city: string;
  county: string;
  phone: string;
  email: string;
  website: string | null;
  logo_url: string | null;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  stripe_account_id: string | null;
  smartbill_series: string | null;
  smartbill_username: string | null;
  smartbill_token: string | null;
  contract_template_url: string | null;
  contract_template_name: string | null;
  is_approved: boolean;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  company_id: string;
  name: string;
  category: VehicleCategory;
  seats: number;
  brand: string;
  model: string;
  year: number;
  features: string[];
  images: string[];
  is_active: boolean;
  created_at: string;
}

export interface TransportRequest {
  id: string;
  client_id: string;
  pickup_location: string;
  pickup_city: string;
  dropoff_location: string;
  dropoff_city: string;
  departure_date: string;
  return_date: string | null;
  is_round_trip: boolean;
  passengers: number;
  vehicle_category: VehicleCategory | null;
  description: string | null;
  status: RequestStatus;
  offers_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  client?: Profile;
}

export interface Offer {
  id: string;
  request_id: string;
  company_id: string;
  vehicle_id: string;
  price: number;
  currency: string;
  message: string | null;
  includes_driver: boolean;
  includes_fuel: boolean;
  valid_until: string;
  status: OfferStatus;
  contract_url: string | null;
  contract_name: string | null;
  created_at: string;
  // Joined fields
  company?: Company;
  vehicle?: Vehicle;
  request?: TransportRequest;
}

export interface Booking {
  id: string;
  offer_id: string;
  client_id: string;
  company_id: string;
  status: BookingStatus;
  total_price: number;
  currency: string;
  notes: string | null;
  contract_accepted: boolean;
  contract_accepted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  offer?: Offer;
  client?: Profile;
  company?: Company;
}

export interface Payment {
  id: string;
  booking_id: string;
  stripe_payment_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  client_id: string;
  company_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  // Joined fields
  client?: Profile;
}

export interface Invoice {
  id: string;
  booking_id: string;
  invoice_type: InvoiceType;
  smartbill_number: string | null;
  smartbill_series: string | null;
  issuer_name: string;
  issuer_cui: string;
  client_name: string;
  amount: number;
  vat_amount: number | null;
  currency: string;
  status: InvoiceStatus;
  error_message: string | null;
  created_at: string;
}

export const VEHICLE_CATEGORIES: Record<
  VehicleCategory,
  { label: string; labelEn: string; minSeats: number; maxSeats: number }
> = {
  ridesharing: { label: "Ride Sharing", labelEn: "Ride Sharing", minSeats: 4, maxSeats: 9 },
  microbuz: { label: "Microbuz", labelEn: "Minibus", minSeats: 9, maxSeats: 23 },
  midiautocar: { label: "Midiautocar", labelEn: "Midi Coach", minSeats: 24, maxSeats: 35 },
  autocar: { label: "Autocar", labelEn: "Coach", minSeats: 36, maxSeats: 52 },
  autocar_maxi: { label: "Autocar Maxi", labelEn: "Maxi Coach", minSeats: 53, maxSeats: 60 },
  autocar_grand_turismo: { label: "Autocar Grand Turismo", labelEn: "Grand Turismo Coach", minSeats: 61, maxSeats: 80 },
};

export const ROMANIAN_COUNTIES = [
  "Alba",
  "Arad",
  "Argeș",
  "Bacău",
  "Bihor",
  "Bistrița-Năsăud",
  "Botoșani",
  "Brăila",
  "Brașov",
  "București",
  "Buzău",
  "Călărași",
  "Caraș-Severin",
  "Cluj",
  "Constanța",
  "Covasna",
  "Dâmbovița",
  "Dolj",
  "Galați",
  "Giurgiu",
  "Gorj",
  "Harghita",
  "Hunedoara",
  "Ialomița",
  "Iași",
  "Ilfov",
  "Maramureș",
  "Mehedinți",
  "Mureș",
  "Neamț",
  "Olt",
  "Prahova",
  "Sălaj",
  "Satu Mare",
  "Sibiu",
  "Suceava",
  "Teleorman",
  "Timiș",
  "Tulcea",
  "Vaslui",
  "Vâlcea",
  "Vrancea",
] as const;
