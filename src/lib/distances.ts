// Distanțe rutiere între principalele orașe din România (km, sens unic)
// Sursa: distanțe aproximative pe autostradă/drum național

const CITY_DISTANCES: Record<string, Record<string, number>> = {
  bucuresti: {
    brasov: 166, cluj: 461, timisoara: 533, iasi: 406, constanta: 225,
    sibiu: 296, craiova: 227, oradea: 600, galati: 225, ploiesti: 60,
    pitesti: 111, buzau: 127, targu_mures: 327, alba_iulia: 368,
    arad: 558, suceava: 450, bacau: 296, baia_mare: 594,
    deva: 404, hunedoara: 417, sighisoara: 267, bistrita: 420,
    ramnicu_valcea: 192, targoviste: 80, alexandria: 88,
    slobozia: 127, calarasi: 115, giurgiu: 65,
  },
  brasov: {
    bucuresti: 166, cluj: 274, sibiu: 143, targu_mures: 168,
    sighisoara: 115, ploiesti: 130, buzau: 160, alba_iulia: 217,
    timisoara: 395, iasi: 400, constanta: 375, pitesti: 200,
    oradea: 440, suceava: 380, bacau: 230, bistrita: 260,
    deva: 266, ramnicu_valcea: 175,
  },
  cluj: {
    bucuresti: 461, brasov: 274, timisoara: 320, sibiu: 175,
    oradea: 153, targu_mures: 105, alba_iulia: 101, bistrita: 112,
    baia_mare: 193, sighisoara: 164, deva: 189, arad: 262,
    iasi: 500, constanta: 680, suceava: 340, hunedoara: 200,
  },
  timisoara: {
    bucuresti: 533, cluj: 320, arad: 55, oradea: 268,
    deva: 175, hunedoara: 188, sibiu: 303, craiova: 360,
    brasov: 395, alba_iulia: 280, iasi: 700, constanta: 750,
  },
  iasi: {
    bucuresti: 406, suceava: 145, bacau: 133, galati: 215,
    brasov: 400, cluj: 500, constanta: 520, timisoara: 700,
    piatra_neamt: 120, botosani: 40, vaslui: 75,
  },
  constanta: {
    bucuresti: 225, galati: 185, brasov: 375, buzau: 285,
    tulcea: 125, calarasi: 180, slobozia: 130, mangalia: 44,
  },
  sibiu: {
    bucuresti: 296, brasov: 143, cluj: 175, alba_iulia: 75,
    targu_mures: 112, deva: 127, ramnicu_valcea: 105,
    timisoara: 303, sighisoara: 91, hunedoara: 138,
  },
  craiova: {
    bucuresti: 227, pitesti: 107, timisoara: 360, sibiu: 222,
    ramnicu_valcea: 109, drobeta: 113, targu_jiu: 107,
    alexandria: 148, slatina: 55,
  },
  oradea: {
    bucuresti: 600, cluj: 153, timisoara: 268, arad: 118,
    baia_mare: 178, deva: 220, alba_iulia: 248,
  },
};

// Normalize city name for lookup
function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/\s*-\s*/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^municipiul_/, "")
    .replace(/^oras_/, "")
    .replace(/targu/g, "targu")
    .replace(/ramnicu/g, "ramnicu")
    .trim();
}

// Try to find distance between two cities
export function getDistanceKm(fromCity: string, toCity: string): number | null {
  const from = normalizeCity(fromCity);
  const to = normalizeCity(toCity);

  if (from === to) return 0;

  // Direct lookup
  if (CITY_DISTANCES[from]?.[to]) return CITY_DISTANCES[from][to];
  if (CITY_DISTANCES[to]?.[from]) return CITY_DISTANCES[to][from];

  // Try partial match
  for (const [cityKey, distances] of Object.entries(CITY_DISTANCES)) {
    if (from.includes(cityKey) || cityKey.includes(from)) {
      for (const [destKey, km] of Object.entries(distances)) {
        if (to.includes(destKey) || destKey.includes(to)) {
          return km;
        }
      }
    }
  }

  // Reverse partial match
  for (const [cityKey, distances] of Object.entries(CITY_DISTANCES)) {
    if (to.includes(cityKey) || cityKey.includes(to)) {
      for (const [destKey, km] of Object.entries(distances)) {
        if (from.includes(destKey) || destKey.includes(from)) {
          return km;
        }
      }
    }
  }

  return null;
}

// Tarife per km fără TVA per categorie
export const TARIFFS: Record<string, number> = {
  ridesharing: 2.50,
  microbuz: 4.50,
  midiautocar: 6.50,
  autocar: 7.50,
  autocar_maxi: 8.50,
  autocar_grand_turismo: 9.50,
};

export const TVA_RATE = 0.21;
export const PLATFORM_FEE_RATE = 0.05;
export const MIN_KM_PER_DAY = 200;

export interface PriceCalculation {
  distanceOneWay: number;
  totalKmReal: number;
  totalKmBillable: number;
  days: number;
  tariffPerKm: number;
  subtotalNoVat: number;
  tva: number;
  subtotalWithVat: number;
  platformFee: number;
  totalPrice: number;
}

export function calculatePrice(
  fromCity: string,
  toCity: string,
  isRoundTrip: boolean,
  days: number,
  vehicleCategory: string,
): PriceCalculation | null {
  const tariffPerKm = TARIFFS[vehicleCategory];
  if (!tariffPerKm) return null;

  return calculatePriceCustom(fromCity, toCity, isRoundTrip, days, tariffPerKm, MIN_KM_PER_DAY);
}

// Calcul cu tarif personalizat (de la transportator)
export function calculatePriceCustom(
  fromCity: string,
  toCity: string,
  isRoundTrip: boolean,
  days: number,
  tariffPerKm: number,
  minKmPerDay: number = MIN_KM_PER_DAY,
): PriceCalculation | null {
  const distanceOneWay = getDistanceKm(fromCity, toCity);
  if (distanceOneWay === null) return null;

  // Total real km
  const totalKmReal = isRoundTrip ? distanceOneWay * 2 : distanceOneWay;

  // Billable: distribute km across days, min km/day
  const kmPerDay = days > 0 ? totalKmReal / days : totalKmReal;
  const totalKmBillable = days > 0
    ? Array.from({ length: days }, () => Math.max(kmPerDay, minKmPerDay)).reduce((a, b) => a + b, 0)
    : Math.max(totalKmReal, minKmPerDay);

  const subtotalNoVat = totalKmBillable * tariffPerKm;
  const tva = subtotalNoVat * TVA_RATE;
  const subtotalWithVat = subtotalNoVat + tva;
  const platformFee = subtotalWithVat * PLATFORM_FEE_RATE;
  const totalPrice = subtotalWithVat + platformFee;

  return {
    distanceOneWay,
    totalKmReal,
    totalKmBillable,
    days,
    tariffPerKm,
    subtotalNoVat,
    tva,
    subtotalWithVat,
    platformFee,
    totalPrice,
  };
}
