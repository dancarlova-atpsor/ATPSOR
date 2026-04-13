"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useState, useEffect } from "react";
import {
  Bus,
  FileText,
  MessageSquare,
  CalendarCheck,
  DollarSign,
  Plus,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Upload,
  AlertTriangle,
  CheckCircle,
  Shield,
  FileCheck,
  Loader2,
  Lock,
  Unlock,
  Building2,
  Save,
  Camera,
  FileSignature,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VEHICLE_CATEGORIES, ROMANIAN_COUNTIES } from "@/types/database";
import { uploadFile } from "@/lib/supabase/storage";
import BookingLinkForm from "@/components/transporter/BookingLinkForm";
import { DocumentUpload } from "@/components/transporter/DocumentUpload";
import VehicleCalendar from "@/components/transporter/VehicleCalendar";
import InvoiceList from "@/components/invoices/InvoiceList";

const VEHICLE_DOC_TYPES = [
  { type: "vehicle_registration_itp", label: "Talon cu ITP valabil" },
  { type: "certified_copy", label: "Copie Conformă" },
  {
    type: "passenger_luggage_insurance",
    label: "Asigurare Bagaje și Călători",
  },
  { type: "rca_insurance", label: "Asigurare RCA" },
];

export default function TransporterDashboard() {
  const t = useTranslations();
  const router = useRouter();
  const validTabs = ["requests", "offers", "vehicles", "invoices", "documents", "pricing", "profile"] as const;
  type TabType = typeof validTabs[number];
  const hashTab = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
  const initialTab = validTabs.includes(hashTab as TabType) ? (hashTab as TabType) : "requests";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [availableRequests, setAvailableRequests] = useState<any[]>([]);
  const [companyDocs, setCompanyDocs] = useState<any[]>([]);
  const [vehicleDocs, setVehicleDocs] = useState<any[]>([]);
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [togglingVehicle, setTogglingVehicle] = useState<string | null>(null);
  const [vehicleBlocks, setVehicleBlocks] = useState<any[]>([]);
  const [blockingVehicleId, setBlockingVehicleId] = useState<string | null>(null);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [savingBlock, setSavingBlock] = useState(false);
  const [pricing, setPricing] = useState<any[]>([]);
  const [savingPricing, setSavingPricing] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Vehicle editing state
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [vehicleEditForm, setVehicleEditForm] = useState({ name: "", brand: "", model: "", year: "", seats: "", features: "" });
  const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);
  const [vehicleExistingPhotos, setVehicleExistingPhotos] = useState<string[]>([]);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleMsg, setVehicleMsg] = useState("");

  // Profile editing state
  const [profileForm, setProfileForm] = useState({
    description: "", address: "", city: "", county: "",
    phone: "", email: "", website: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [contractTemplateFile, setContractTemplateFile] = useState<File | null>(null);
  const [savingContract, setSavingContract] = useState(false);
  const [contractMsg, setContractMsg] = useState("");

  // Company creation form state
  const [companyForm, setCompanyForm] = useState({
    name: "",
    cui: "",
    license_number: "",
    address: "",
    city: "",
    county: "",
    phone: "",
    email: "",
  });
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [companyError, setCompanyError] = useState("");

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);
      setCompanyForm((prev) => ({ ...prev, email: user.email || "" }));

      // Get company
      const { data: comp } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (!comp) {
        setLoading(false);
        return;
      }

      setCompany(comp);
      setProfileForm({
        description: comp.description || "",
        address: comp.address || "",
        city: comp.city || "",
        county: comp.county || "",
        phone: comp.phone || "",
        email: comp.email || "",
        website: comp.website || "",
      });
      setLogoPreview(comp.logo_url || null);

      // Fetch all data in parallel
      const [
        vehiclesRes,
        requestsRes,
        companyDocsRes,
        vehicleDocsRes,
        offersRes,
        bookingsRes,
        pricingRes,
      ] = await Promise.all([
        supabase
          .from("vehicles")
          .select("*")
          .eq("company_id", comp.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("transport_requests")
          .select("*")
          .in("status", ["pending", "active"])
          .gte(
            "departure_date",
            new Date().toISOString().split("T")[0]
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("company_documents")
          .select("*")
          .eq("company_id", comp.id),
        supabase
          .from("vehicle_documents")
          .select("*")
          .eq("company_id", comp.id),
        supabase
          .from("offers")
          .select(
            "*, request:transport_requests(*), vehicle:vehicles(*)"
          )
          .eq("company_id", comp.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("bookings")
          .select("total_price")
          .eq("company_id", comp.id),
        supabase
          .from("company_pricing")
          .select("*")
          .eq("company_id", comp.id),
      ]);

      if (vehiclesRes.data) {
        setVehicles(vehiclesRes.data);
        // Load blocks for all vehicles
        const vehicleIds = vehiclesRes.data.map((v: any) => v.id);
        if (vehicleIds.length > 0) {
          const today = new Date().toISOString().split("T")[0];
          const { data: blocksData } = await supabase
            .from("vehicle_blocks")
            .select("*")
            .in("vehicle_id", vehicleIds)
            .gte("end_date", today)
            .order("start_date", { ascending: true });
          if (blocksData) setVehicleBlocks(blocksData);
        }
      }
      if (requestsRes.data) setAvailableRequests(requestsRes.data);
      if (companyDocsRes.data) setCompanyDocs(companyDocsRes.data);
      if (vehicleDocsRes.data) setVehicleDocs(vehicleDocsRes.data);
      if (offersRes.data) setMyOffers(offersRes.data);
      if (pricingRes.data) setPricing(pricingRes.data);
      if (bookingsRes.data) {
        setBookingsCount(bookingsRes.data.length);
        setRevenue(
          bookingsRes.data.reduce(
            (sum, b) => sum + (parseFloat(b.total_price) || 0),
            0
          )
        );
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  function getVehicleDocs(vehicleId: string) {
    return vehicleDocs.filter((d) => d.vehicle_id === vehicleId);
  }

  async function saveBlock() {
    if (!blockingVehicleId || !blockStart || !blockEnd) return;
    setSavingBlock(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vehicle_blocks")
      .insert({
        vehicle_id: blockingVehicleId,
        start_date: blockStart,
        end_date: blockEnd,
        reason: "manual",
      })
      .select()
      .single();
    if (!error && data) {
      setVehicleBlocks((prev) => [...prev, data]);
    }
    setSavingBlock(false);
    setBlockingVehicleId(null);
    setBlockStart("");
    setBlockEnd("");
  }

  async function removeBlock(blockId: string) {
    const supabase = createClient();
    await supabase.from("vehicle_blocks").delete().eq("id", blockId);
    setVehicleBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }

  function isVehicleDocsValid(vehicleId: string, seats: number) {
    const docs = getVehicleDocs(vehicleId);
    const today = new Date().toISOString().split("T")[0];
    const hasItp = docs.some(
      (d) =>
        d.document_type === "vehicle_registration_itp" &&
        d.expiry_date >= today
    );
    const hasRca = docs.some(
      (d) => d.document_type === "rca_insurance" && d.expiry_date >= today
    );
    if (seats <= 9) return hasItp && hasRca;
    const hasCopy = docs.some(
      (d) => d.document_type === "certified_copy" && d.expiry_date >= today
    );
    const hasInsurance = docs.some(
      (d) =>
        d.document_type === "passenger_luggage_insurance" &&
        d.expiry_date >= today
    );
    return hasItp && hasRca && hasCopy && hasInsurance;
  }

  function startEditVehicle(vehicle: any) {
    setEditingVehicleId(vehicle.id);
    setVehicleEditForm({
      name: vehicle.name || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: String(vehicle.year || ""),
      seats: String(vehicle.seats || ""),
      features: (vehicle.features || []).join(", "),
    });
    setVehicleExistingPhotos(vehicle.images || []);
    setVehiclePhotos([]);
    setVehicleMsg("");
  }

  async function saveVehicleEdit() {
    if (!editingVehicleId || !company) return;
    setSavingVehicle(true);
    setVehicleMsg("");

    const supabase = createClient();

    // Upload new photos
    const newPhotoUrls: string[] = [];
    for (const photo of vehiclePhotos) {
      const result = await uploadFile(photo, `vehicles/${editingVehicleId}`);
      if (result) newPhotoUrls.push(result.url);
    }

    // Combine existing + new, max 5
    const allPhotos = [...vehicleExistingPhotos, ...newPhotoUrls].slice(0, 5);

    const { error } = await supabase
      .from("vehicles")
      .update({
        name: vehicleEditForm.name.trim(),
        brand: vehicleEditForm.brand.trim(),
        model: vehicleEditForm.model.trim(),
        year: parseInt(vehicleEditForm.year) || 2020,
        seats: parseInt(vehicleEditForm.seats) || 0,
        features: vehicleEditForm.features.split(",").map(f => f.trim()).filter(Boolean),
        images: allPhotos,
      })
      .eq("id", editingVehicleId);

    if (error) {
      setVehicleMsg("Eroare: " + error.message);
    } else {
      setVehicles(prev => prev.map(v => v.id === editingVehicleId ? {
        ...v,
        name: vehicleEditForm.name.trim(),
        brand: vehicleEditForm.brand.trim(),
        model: vehicleEditForm.model.trim(),
        year: parseInt(vehicleEditForm.year) || 2020,
        seats: parseInt(vehicleEditForm.seats) || 0,
        features: vehicleEditForm.features.split(",").map(f => f.trim()).filter(Boolean),
        images: allPhotos,
      } : v));
      setVehicleMsg("Vehicul salvat!");
      setEditingVehicleId(null);
    }
    setSavingVehicle(false);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSavingProfile(true);
    setProfileMsg("");

    const supabase = createClient();
    let logoUrl = company.logo_url;

    if (logoFile) {
      const result = await uploadFile(logoFile, `logos/${company.id}`);
      if (result) logoUrl = result.url;
    }

    const { error } = await supabase
      .from("companies")
      .update({
        description: profileForm.description.trim() || null,
        address: profileForm.address.trim(),
        city: profileForm.city.trim(),
        county: profileForm.county,
        phone: profileForm.phone.trim(),
        email: profileForm.email.trim(),
        website: profileForm.website.trim() || null,
        logo_url: logoUrl,
      })
      .eq("id", company.id);

    if (error) {
      setProfileMsg("Eroare la salvare: " + error.message);
    } else {
      setCompany({ ...company, ...profileForm, logo_url: logoUrl });
      setProfileMsg("Profil salvat cu succes!");
      setLogoFile(null);
    }
    setSavingProfile(false);
  }

  async function saveContractTemplate() {
    if (!company || !contractTemplateFile) return;
    setSavingContract(true);
    setContractMsg("");

    const result = await uploadFile(contractTemplateFile, `contract-templates/${company.id}`);
    if (!result) {
      setContractMsg("Eroare la încărcarea fișierului.");
      setSavingContract(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("companies")
      .update({
        contract_template_url: result.url,
        contract_template_name: contractTemplateFile.name,
      })
      .eq("id", company.id);

    if (error) {
      setContractMsg("Eroare la salvare: " + error.message);
    } else {
      setCompany({ ...company, contract_template_url: result.url, contract_template_name: contractTemplateFile.name });
      setContractMsg("Contract template salvat!");
      setContractTemplateFile(null);
    }
    setSavingContract(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setCreatingCompany(true);
    setCompanyError("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("companies")
      .insert({
        owner_id: user.id,
        name: companyForm.name.trim(),
        cui: companyForm.cui.trim(),
        license_number: companyForm.license_number.trim(),
        address: companyForm.address.trim(),
        city: companyForm.city.trim(),
        county: companyForm.county,
        phone: companyForm.phone.trim(),
        email: companyForm.email.trim(),
      })
      .select()
      .single();

    if (error) {
      setCompanyError(error.message);
      setCreatingCompany(false);
      return;
    }

    if (data) {
      setCompany(data);
    }
    setCreatingCompany(false);
  }

  if (!company) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl bg-white p-8 shadow-md">
          <div className="mb-6 text-center">
            <Bus className="mx-auto h-12 w-12 text-primary-500" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Creează compania de transport
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Completează datele firmei pentru a putea adăuga vehicule și trimite oferte.
            </p>
          </div>

          {companyError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertTriangle className="mr-1 inline h-4 w-4" />
              {companyError}
            </div>
          )}

          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nume firmă *
              </label>
              <input
                type="text"
                required
                value={companyForm.name}
                onChange={(e) =>
                  setCompanyForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="SC Transport SRL"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  CUI *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.cui}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({ ...prev, cui: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="RO12345678"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nr. licență transport *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.license_number}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({
                      ...prev,
                      license_number: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="LT-12345"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Adresă *
              </label>
              <input
                type="text"
                required
                value={companyForm.address}
                onChange={(e) =>
                  setCompanyForm((prev) => ({ ...prev, address: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Str. Exemplu nr. 1"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Oraș *
                </label>
                <input
                  type="text"
                  required
                  value={companyForm.city}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="București"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Județ *
                </label>
                <select
                  required
                  value={companyForm.county}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({ ...prev, county: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Selectează județul</option>
                  {ROMANIAN_COUNTIES.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Telefon *
                </label>
                <input
                  type="tel"
                  required
                  value={companyForm.phone}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="07xx xxx xxx"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={companyForm.email}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="contact@firma.ro"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingCompany}
              className="mt-2 w-full rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {creatingCompany ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se creează...
                </span>
              ) : (
                "Creează compania"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Check approval status
  if (company && !company.is_approved) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-xl bg-white p-8 text-center shadow-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Cont în curs de verificare</h2>
          <p className="mt-3 text-gray-600">
            Contul companiei <strong>{company.name}</strong> este în curs de verificare de către echipa ATPSOR.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Vei fi notificat pe email când contul va fi aprobat. De obicei procesul durează 1-2 zile lucrătoare.
          </p>
          {company.rejection_reason && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-left">
              <p className="text-sm font-medium text-red-700">Motiv respingere:</p>
              <p className="mt-1 text-sm text-red-600">{company.rejection_reason}</p>
            </div>
          )}
          <div className="mt-6 text-sm text-gray-400">
            CUI: {company.cui} | Oraș: {company.city}, {company.county}
          </div>
        </div>
      </div>
    );
  }

  // Tarife default per categorie (fallback)
  const DEFAULT_TARIFFS: Record<string, number> = {
    ridesharing: 2.50,
    microbuz: 4.50,
    midiautocar: 6.50,
    autocar: 7.50,
    autocar_maxi: 8.50,
    autocar_grand_turismo: 9.50,
  };

  function getPricingForCategory(cat: string) {
    return pricing.find((p) => p.vehicle_category === cat);
  }

  async function savePricing(category: string, pricePerKm: number, minKmPerDay: number) {
    if (!company) return;
    setSavingPricing(true);
    const supabase = createClient();
    const existing = getPricingForCategory(category);

    if (existing) {
      const { data, error } = await supabase
        .from("company_pricing")
        .update({ price_per_km: pricePerKm, min_km_per_day: minKmPerDay })
        .eq("id", existing.id)
        .select()
        .single();
      if (!error && data) {
        setPricing((prev) => prev.map((p) => (p.id === existing.id ? data : p)));
      }
    } else {
      const { data, error } = await supabase
        .from("company_pricing")
        .insert({
          company_id: company.id,
          vehicle_category: category,
          price_per_km: pricePerKm,
          min_km_per_day: minKmPerDay,
          currency: "RON",
        })
        .select()
        .single();
      if (!error && data) {
        setPricing((prev) => [...prev, data]);
      }
    }
    setSavingPricing(false);
  }

  const tabs = [
    {
      key: "requests" as const,
      label: t("dashboard.transporter.availableRequests"),
      icon: FileText,
    },
    {
      key: "vehicles" as const,
      label: t("dashboard.transporter.myVehicles"),
      icon: Bus,
    },
    {
      key: "pricing" as const,
      label: "Tarife",
      icon: DollarSign,
    },
    {
      key: "documents" as const,
      label: "Documente",
      icon: FileCheck,
    },
    {
      key: "offers" as const,
      label: t("dashboard.transporter.myOffers"),
      icon: MessageSquare,
    },
    {
      key: "invoices" as const,
      label: "Facturi",
      icon: FileSignature,
    },
    {
      key: "profile" as const,
      label: "Profil Companie",
      icon: Building2,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("dashboard.transporter.title")}
        </h1>
        <div className="flex gap-2">
          <Link
            href="/manual/transportator"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <FileText className="h-4 w-4" />
            Manual
          </Link>
          <Link
            href="/dashboard/transporter/add-vehicle"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            {t("dashboard.transporter.addVehicle")}
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Bus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{vehicles.length}</div>
              <div className="text-xs text-gray-500">Vehicule</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {availableRequests.length}
              </div>
              <div className="text-xs text-gray-500">Cereri disponibile</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <CalendarCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{bookingsCount}</div>
              <div className="text-xs text-gray-500">Rezervări</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {revenue.toLocaleString("ro-RO")}
              </div>
              <div className="text-xs text-gray-500">RON total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-primary-500 text-primary-500"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {availableRequests.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">
                Nu sunt cereri de transport disponibile momentan.
              </p>
            </div>
          ) : (
            availableRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-xl bg-white p-5 shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                    <MapPin className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {request.pickup_city} → {request.dropoff_city}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {request.departure_date}{request.return_date ? ` → ${request.return_date}` : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {request.passengers} pers.
                      </span>
                      {request.vehicle_category && (
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                          {VEHICLE_CATEGORIES[
                            request.vehicle_category as keyof typeof VEHICLE_CATEGORIES
                          ]?.label || request.vehicle_category}
                        </span>
                      )}
                    </div>
                    {request.description && (
                      <p className="mt-1 text-sm text-gray-400">
                        {request.description}
                      </p>
                    )}
                    {request.intermediate_cities && (
                      <p className="mt-1 text-xs text-blue-500">
                        Traseu: {request.pickup_city} → {request.intermediate_cities} → {request.dropoff_city}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={
                    `/dashboard/transporter/offer/${request.id}` as any
                  }
                  className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
                >
                  Trimite Ofertă
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "vehicles" && (
        <div className="space-y-4">
          {/* Calendar disponibilitate */}
          {vehicles.length > 0 && (
            <VehicleCalendar vehicles={vehicles} blocks={vehicleBlocks} />
          )}

          {vehicles.length === 0 ? (
            <div className="py-12 text-center">
              <Bus className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nu ai vehicule adăugate.</p>
              <Link
                href="/dashboard/transporter/add-vehicle"
                className="mt-2 inline-block text-sm font-medium text-primary-500 hover:text-primary-600"
              >
                Adaugă primul vehicul →
              </Link>
            </div>
          ) : (
            vehicles.map((vehicle) => {
              const docsValid = isVehicleDocsValid(vehicle.id, vehicle.seats);
              const vBlocks = vehicleBlocks.filter((b) => b.vehicle_id === vehicle.id);
              const today = new Date().toISOString().split("T")[0];
              const isCurrentlyBlocked = vBlocks.some(
                (b) => b.start_date <= today && b.end_date >= today
              );
              const isAddingBlock = blockingVehicleId === vehicle.id;

              return (
                <div key={vehicle.id} className="rounded-xl bg-white shadow-md">
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isCurrentlyBlocked ? "bg-red-50" : "bg-primary-50"}`}>
                        <Bus className={`h-6 w-6 ${isCurrentlyBlocked ? "text-red-400" : "text-primary-500"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                          {vehicle.name}
                          {isCurrentlyBlocked && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                              Blocat azi
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                          <span>{vehicle.seats} locuri</span>
                          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                            {VEHICLE_CATEGORIES[vehicle.category as keyof typeof VEHICLE_CATEGORIES]?.label || vehicle.category}
                          </span>
                          {docsValid ? (
                            <span className="hidden items-center gap-1 text-xs text-green-600 sm:flex">
                              <CheckCircle className="h-3.5 w-3.5" /> Documente ok
                            </span>
                          ) : (
                            <span className="hidden items-center gap-1 text-xs text-red-500 sm:flex">
                              <AlertTriangle className="h-3.5 w-3.5" /> Documente lipsă
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                    <button
                      onClick={() => startEditVehicle(vehicle)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                    >
                      <Camera className="h-4 w-4" />
                      Editează
                    </button>
                    <button
                      onClick={() => setBlockingVehicleId(isAddingBlock ? null : vehicle.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <Lock className="h-4 w-4" />
                      Blochează perioadă
                    </button>
                    </div>
                  </div>

                  {/* Form adăugare blocare */}
                  {isAddingBlock && (
                    <div className="border-t border-gray-100 bg-red-50 px-5 py-4">
                      <p className="mb-3 text-sm font-medium text-gray-700">
                        Blochează vehiculul pentru o perioadă (rezervare externă):
                      </p>
                      <div className="flex flex-wrap items-end gap-3">
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">De la *</label>
                          <input
                            type="date"
                            value={blockStart}
                            onChange={(e) => setBlockStart(e.target.value)}
                            min={today}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Până la *</label>
                          <input
                            type="date"
                            value={blockEnd}
                            onChange={(e) => setBlockEnd(e.target.value)}
                            min={blockStart || today}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={saveBlock}
                          disabled={!blockStart || !blockEnd || savingBlock}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {savingBlock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                          Confirmă blocarea
                        </button>
                        <button
                          onClick={() => { setBlockingVehicleId(null); setBlockStart(""); setBlockEnd(""); }}
                          className="text-sm text-gray-400 hover:text-gray-600"
                        >
                          Anulează
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Blocări existente */}
                  {vBlocks.length > 0 && (
                    <div className="border-t border-gray-100 px-5 py-3">
                      <p className="mb-2 text-xs font-medium text-gray-500">Perioade blocate:</p>
                      <div className="flex flex-wrap gap-2">
                        {vBlocks.map((block) => (
                          <div key={block.id} className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                            <span>
                              {block.start_date === block.end_date
                                ? block.start_date
                                : `${block.start_date} → ${block.end_date}`}
                            </span>
                            {block.reason === "manual" && (
                              <button
                                onClick={() => removeBlock(block.id)}
                                className="ml-1 text-gray-400 hover:text-red-500"
                              >
                                ×
                              </button>
                            )}
                            {block.reason === "booking" && (
                              <span className="text-primary-500">rezervat</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Editare vehicul */}
                  {editingVehicleId === vehicle.id && (
                    <div className="border-t border-gray-100 bg-blue-50 px-5 py-4">
                      <h4 className="mb-3 text-sm font-semibold text-gray-700">Editează vehiculul</h4>
                      {vehicleMsg && (
                        <div className={`mb-3 rounded p-2 text-sm ${vehicleMsg.includes("Eroare") ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                          {vehicleMsg}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Denumire</label>
                          <input type="text" value={vehicleEditForm.name} onChange={e => setVehicleEditForm(p => ({...p, name: e.target.value}))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Marcă</label>
                          <input type="text" value={vehicleEditForm.brand} onChange={e => setVehicleEditForm(p => ({...p, brand: e.target.value}))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Model</label>
                          <input type="text" value={vehicleEditForm.model} onChange={e => setVehicleEditForm(p => ({...p, model: e.target.value}))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">An</label>
                          <input type="number" value={vehicleEditForm.year} onChange={e => setVehicleEditForm(p => ({...p, year: e.target.value}))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Locuri</label>
                          <input type="number" value={vehicleEditForm.seats} onChange={e => setVehicleEditForm(p => ({...p, seats: e.target.value}))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-500">Dotări (separate cu virgulă)</label>
                          <input type="text" value={vehicleEditForm.features} onChange={e => setVehicleEditForm(p => ({...p, features: e.target.value}))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                            placeholder="AC, WiFi, TV..." />
                        </div>
                      </div>

                      {/* Poze existente */}
                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-medium text-gray-500">Poze vehicul (max 5)</label>
                        <div className="flex flex-wrap gap-3">
                          {vehicleExistingPhotos.map((url, i) => (
                            <div key={i} className="group relative h-24 w-32 overflow-hidden rounded-lg border border-gray-200">
                              <img src={url} alt={`Poza ${i+1}`} className="h-full w-full object-cover" />
                              <button type="button" onClick={() => setVehicleExistingPhotos(prev => prev.filter((_, j) => j !== i))}
                                className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {vehiclePhotos.map((file, i) => (
                            <div key={`new-${i}`} className="group relative h-24 w-32 overflow-hidden rounded-lg border-2 border-green-300">
                              <img src={URL.createObjectURL(file)} alt={`Nouă ${i+1}`} className="h-full w-full object-cover" />
                              <button type="button" onClick={() => setVehiclePhotos(prev => prev.filter((_, j) => j !== i))}
                                className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {(vehicleExistingPhotos.length + vehiclePhotos.length) < 5 && (
                            <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400">
                              <Camera className="h-6 w-6 text-gray-400" />
                              <span className="mt-1 text-xs text-gray-400">Adaugă</span>
                              <input type="file" accept="image/*" multiple className="hidden"
                                onChange={e => {
                                  const files = Array.from(e.target.files || []);
                                  const maxNew = 5 - vehicleExistingPhotos.length - vehiclePhotos.length;
                                  setVehiclePhotos(prev => [...prev, ...files.slice(0, maxNew)]);
                                  e.target.value = "";
                                }} />
                            </label>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button onClick={saveVehicleEdit} disabled={savingVehicle}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                          {savingVehicle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Salvează
                        </button>
                        <button onClick={() => setEditingVehicleId(null)} className="text-xs text-gray-400 hover:text-gray-600">
                          Anulează
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Link direct rezervare */}
                  <div className="border-t border-gray-100 px-5 py-3">
                    <BookingLinkForm
                      vehicleId={vehicle.id}
                      companyId={company.id}
                      vehicleName={vehicle.name}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "pricing" && (
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <p>Setează tariful per km (fără TVA) pentru fiecare categorie de vehicul pe care o deții. Clientii vor vedea prețul calculat automat pe baza distanței și a tarifului tău.</p>
          </div>
          {Object.entries(VEHICLE_CATEGORIES).map(([cat, info]) => {
            const hasVehicle = vehicles.some((v) => v.category === cat);
            if (!hasVehicle) return null;
            const existing = getPricingForCategory(cat);
            const defaultPrice = DEFAULT_TARIFFS[cat] || 7.50;
            const currentPrice = existing?.price_per_km || "";
            const currentMinKm = existing?.min_km_per_day || 200;

            return (
              <div key={cat} className="rounded-xl bg-white p-5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <Bus className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{info.label}</div>
                      <div className="text-xs text-gray-400">{info.minSeats}–{info.maxSeats} locuri</div>
                    </div>
                  </div>
                  {existing && (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
                      Tarif setat
                    </span>
                  )}
                </div>
                <form
                  className="mt-4 flex flex-wrap items-end gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const price = parseFloat((form.elements.namedItem("price") as HTMLInputElement).value);
                    const minKm = parseInt((form.elements.namedItem("minKm") as HTMLInputElement).value) || 200;
                    if (price > 0) savePricing(cat, price, minKm);
                  }}
                >
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Preț per km (RON, fără TVA) *</label>
                    <input
                      name="price"
                      type="number"
                      step="0.10"
                      min="0.50"
                      max="50"
                      defaultValue={currentPrice}
                      placeholder={`implicit: ${defaultPrice}`}
                      className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Minim km/zi</label>
                    <input
                      name="minKm"
                      type="number"
                      min="50"
                      max="1000"
                      defaultValue={currentMinKm}
                      className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPricing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {savingPricing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {existing ? "Actualizează" : "Salvează"}
                  </button>
                </form>
                {!existing && (
                  <p className="mt-2 text-xs text-gray-400">
                    Dacă nu setezi un tarif, se va folosi tariful implicit de {defaultPrice} RON/km.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-6">
          {/* Company Documents */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Shield className="h-5 w-5 text-primary-500" />
              Documente Firmă
            </h3>
            <div className="space-y-3">
              <DocumentUpload
                companyId={company.id}
                documentType="company_license"
                label="Licență Transport"
                existingDoc={companyDocs.find((d: any) => d.document_type === "company_license") || null}
                onUploaded={() => { window.location.hash = "documents"; window.location.reload(); }}
              />
            </div>
          </div>

          {/* Vehicle Documents */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Bus className="h-5 w-5 text-primary-500" />
              Documente Vehicule
            </h3>
            {vehicles.map((vehicle) => {
              const vDocs = getVehicleDocs(vehicle.id);
              return (
                <div key={vehicle.id} className="mb-6">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    {vehicle.name}
                    <span className="text-xs font-normal text-gray-400">
                      ({vehicle.seats} locuri)
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {VEHICLE_DOC_TYPES.filter(
                      (docType) =>
                        !(docType.type === "certified_copy" && vehicle.seats <= 9) &&
                        !(docType.type === "passenger_luggage_insurance" && vehicle.seats <= 9)
                    ).map((docType) => (
                      <DocumentUpload
                        key={docType.type}
                        companyId={company.id}
                        vehicleId={vehicle.id}
                        documentType={docType.type}
                        label={docType.label}
                        existingDoc={vDocs.find((d: any) => d.document_type === docType.type) || null}
                        onUploaded={() => { window.location.hash = "documents"; window.location.reload(); }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-medium">Documente obligatorii:</p>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  <li>
                    <strong>Licență transport</strong> - la nivel de firmă
                  </li>
                  <li>
                    <strong>Talon cu ITP valabil</strong> - pentru fiecare
                    vehicul
                  </li>
                  <li>
                    <strong>Copie conformă</strong> - pentru vehicule cu mai
                    mult de 9 locuri
                  </li>
                  <li>
                    <strong>Asigurare bagaje și călători</strong> - pentru
                    vehicule cu mai mult de 9 locuri
                  </li>
                  <li>
                    <strong>Asigurare RCA</strong> - pentru fiecare vehicul
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "offers" && (
        <div className="space-y-4">
          {myOffers.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">
                Nu ai trimis încă nicio ofertă. Verifică cererile
                disponibile!
              </p>
            </div>
          ) : (
            myOffers.map((offer) => (
              <div
                key={offer.id}
                className="flex items-center justify-between rounded-xl bg-white p-5 shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-50">
                    <MessageSquare className="h-6 w-6 text-accent-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {offer.request?.pickup_city} →{" "}
                      {offer.request?.dropoff_city}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span>{offer.price} RON/km</span>
                      <span>{offer.vehicle?.name}</span>
                      <span>{offer.request?.departure_date}</span>
                    </div>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    offer.status === "accepted"
                      ? "bg-green-50 text-green-600"
                      : offer.status === "rejected"
                        ? "bg-red-50 text-red-600"
                        : "bg-yellow-50 text-yellow-600"
                  }`}
                >
                  {offer.status === "accepted"
                    ? "Acceptată"
                    : offer.status === "rejected"
                      ? "Respinsă"
                      : "În așteptare"}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "invoices" && (
        <InvoiceList role="transporter" />
      )}

      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Profil Companie */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Building2 className="h-5 w-5 text-primary-500" />
              Profil Companie
            </h3>

            {profileMsg && (
              <div className={`mb-4 rounded-lg p-3 text-sm ${profileMsg.includes("Eroare") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                {profileMsg}
              </div>
            )}

            {/* Logo */}
            <div className="mb-6 flex items-center gap-6">
              <div className="relative">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-24 w-24 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gray-100 border border-gray-200">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                  <Upload className="h-4 w-4" />
                  Schimbă logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFile(file);
                        setLogoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
                <p className="mt-1 text-xs text-gray-400">JPG, PNG. Max 2MB.</p>
              </div>
            </div>

            {/* Read-only fields */}
            <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Nume firmă</label>
                <p className="mt-1 font-semibold text-gray-900">{company.name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">CUI</label>
                <p className="mt-1 font-semibold text-gray-900">{company.cui}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Nr. licență</label>
                <p className="mt-1 font-semibold text-gray-900">{company.license_number}</p>
              </div>
            </div>

            {/* Editable form */}
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descriere companie</label>
                <textarea
                  value={profileForm.description}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Prezentare scurtă a companiei..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Adresă *</label>
                <input
                  type="text" required
                  value={profileForm.address}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Oraș *</label>
                  <input
                    type="text" required
                    value={profileForm.city}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Județ *</label>
                  <select
                    required
                    value={profileForm.county}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, county: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Selectează</option>
                    {ROMANIAN_COUNTIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Telefon *</label>
                  <input
                    type="tel" required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email" required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="https://www.firma.ro"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvează profilul
              </button>
            </form>
          </div>

          {/* Contract Template */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FileSignature className="h-5 w-5 text-primary-500" />
              Contract Template
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Încarcă modelul tău de contract. Acesta va fi atașat automat la ofertele trimise clienților.
              Clientul va putea citi și accepta contractul înainte de plată.
            </p>

            {contractMsg && (
              <div className={`mb-4 rounded-lg p-3 text-sm ${contractMsg.includes("Eroare") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                {contractMsg}
              </div>
            )}

            {company.contract_template_url && (
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-green-50 p-3">
                <FileCheck className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700">Contract încărcat</p>
                  <p className="text-xs text-green-600">{company.contract_template_name}</p>
                </div>
                <a
                  href={company.contract_template_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-green-700 underline hover:text-green-800"
                >
                  Vizualizează
                </a>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:border-primary-400 hover:text-primary-600">
                <Upload className="h-4 w-4" />
                {company.contract_template_url ? "Înlocuiește contractul" : "Încarcă contract (PDF)"}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setContractTemplateFile(file);
                  }}
                />
              </label>
              {contractTemplateFile && (
                <>
                  <span className="text-sm text-gray-500">{contractTemplateFile.name}</span>
                  <button
                    onClick={saveContractTemplate}
                    disabled={savingContract}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                  >
                    {savingContract ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvează
                  </button>
                </>
              )}
            </div>
          </div>

          {/* SmartBill Facturare */}
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <DollarSign className="h-5 w-5 text-primary-500" />
              SmartBill - Facturare Automată
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Conectează-ți contul SmartBill gratuit pentru a emite facturi automat către clienți.
              Creează un cont gratuit la <a href="https://www.smartbill.ro" target="_blank" rel="noopener noreferrer" className="text-primary-500 underline">smartbill.ro</a> dacă nu ai deja.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">SmartBill Email (username)</label>
                <input
                  type="email"
                  value={company.smartbill_username || ""}
                  onChange={(e) => setCompany({...company, smartbill_username: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="email@smartbill.ro"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">SmartBill Token (API Key)</label>
                <input
                  type="password"
                  value={company.smartbill_token || ""}
                  onChange={(e) => setCompany({...company, smartbill_token: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Se găsește în SmartBill → Setări → API"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Serie factură</label>
                <input
                  type="text"
                  value={company.smartbill_series || ""}
                  onChange={(e) => setCompany({...company, smartbill_series: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Ex: TRANS LEI"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Serie proformă</label>
                <input
                  type="text"
                  value={company.smartbill_proforma_series || ""}
                  onChange={(e) => setCompany({...company, smartbill_proforma_series: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Ex: TRANSLEI"
                />
              </div>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.from("companies").update({
                    smartbill_username: company.smartbill_username,
                    smartbill_token: company.smartbill_token,
                    smartbill_series: company.smartbill_series,
                    smartbill_proforma_series: company.smartbill_proforma_series,
                  }).eq("id", company.id);
                  alert("SmartBill salvat!");
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-600"
              >
                <Save className="h-4 w-4" />
                Salvează SmartBill
              </button>

              {company.smartbill_username && company.smartbill_token && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle className="mr-1 inline h-4 w-4" />
                  SmartBill configurat. Facturile vor fi emise automat pe firma ta la fiecare plată.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
