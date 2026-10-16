/**
 * Countries & Flags Service
 * Integrates with RestCountries / FlagCDN / CountriesNow to fetch complete country data
 * with official flags, ISO-2 codes, and names, with local fallback and caching.
 */

export const FALLBACK_COUNTRIES = [
  { name: 'China', code: 'CN', flag: 'https://flagcdn.com/w40/cn.png', emoji: '🇨🇳' },
  { name: 'Japan', code: 'JP', flag: 'https://flagcdn.com/w40/jp.png', emoji: '🇯🇵' },
  { name: 'India', code: 'IN', flag: 'https://flagcdn.com/w40/in.png', emoji: '🇮🇳' },
  { name: 'Thailand', code: 'TH', flag: 'https://flagcdn.com/w40/th.png', emoji: '🇹🇭' },
  { name: 'Malaysia', code: 'MY', flag: 'https://flagcdn.com/w40/my.png', emoji: '🇲🇾' },
  { name: 'Singapore', code: 'SG', flag: 'https://flagcdn.com/w40/sg.png', emoji: '🇸🇬' },
  { name: 'United Arab Emirates', code: 'AE', flag: 'https://flagcdn.com/w40/ae.png', emoji: '🇦🇪' },
  { name: 'Saudi Arabia', code: 'SA', flag: 'https://flagcdn.com/w40/sa.png', emoji: '🇸🇦' },
  { name: 'United Kingdom', code: 'GB', flag: 'https://flagcdn.com/w40/gb.png', emoji: '🇬🇧' },
  { name: 'United States', code: 'US', flag: 'https://flagcdn.com/w40/us.png', emoji: '🇺🇸' },
  { name: 'Canada', code: 'CA', flag: 'https://flagcdn.com/w40/ca.png', emoji: '🇨🇦' },
  { name: 'Australia', code: 'AU', flag: 'https://flagcdn.com/w40/au.png', emoji: '🇦🇺' },
  { name: 'France', code: 'FR', flag: 'https://flagcdn.com/w40/fr.png', emoji: '🇫🇷' },
  { name: 'Germany', code: 'DE', flag: 'https://flagcdn.com/w40/de.png', emoji: '🇩🇪' },
  { name: 'Italy', code: 'IT', flag: 'https://flagcdn.com/w40/it.png', emoji: '🇮🇹' },
  { name: 'Spain', code: 'ES', flag: 'https://flagcdn.com/w40/es.png', emoji: '🇪🇸' },
  { name: 'Switzerland', code: 'CH', flag: 'https://flagcdn.com/w40/ch.png', emoji: '🇨🇭' },
  { name: 'South Korea', code: 'KR', flag: 'https://flagcdn.com/w40/kr.png', emoji: '🇰🇷' },
  { name: 'Turkey', code: 'TR', flag: 'https://flagcdn.com/w40/tr.png', emoji: '🇹🇷' },
  { name: 'Qatar', code: 'QA', flag: 'https://flagcdn.com/w40/qa.png', emoji: '🇶🇦' },
  { name: 'Oman', code: 'OM', flag: 'https://flagcdn.com/w40/om.png', emoji: '🇴🇲' },
  { name: 'Vietnam', code: 'VN', flag: 'https://flagcdn.com/w40/vn.png', emoji: '🇻🇳' },
  { name: 'Egypt', code: 'EG', flag: 'https://flagcdn.com/w40/eg.png', emoji: '🇪🇬' },
  { name: 'Brazil', code: 'BR', flag: 'https://flagcdn.com/w40/br.png', emoji: '🇧🇷' },
  { name: 'South Africa', code: 'ZA', flag: 'https://flagcdn.com/w40/za.png', emoji: '🇿🇦' },
  { name: 'Bangladesh', code: 'BD', flag: 'https://flagcdn.com/w40/bd.png', emoji: '🇧🇩' },
  { name: 'Indonesia', code: 'ID', flag: 'https://flagcdn.com/w40/id.png', emoji: '🇮🇩' },
];

export const COUNTRY_CITIES = {
  'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Xi\'an', 'Wuhan', 'Tianjin', 'Chongqing'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Al Ain'],
  'Malaysia': ['Kuala Lumpur', 'Penang (George Town)', 'Langkawi', 'Johor Bahru', 'Malacca', 'Kota Kinabalu', 'Kuching', 'Ipoh'],
  'Singapore': ['Singapore', 'Sentosa', 'Marina Bay', 'Jurong', 'Changi'],
  'Thailand': ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', 'Krabi', 'Koh Samui', 'Hua Hin', 'Chiang Rai'],
  'France': ['Paris', 'Nice', 'Lyon', 'Marseille', 'Bordeaux', 'Strasbourg', 'Toulouse', 'Cannes'],
  'Schengen (France)': ['Paris', 'Nice', 'Lyon', 'Marseille', 'Bordeaux', 'Strasbourg', 'Toulouse', 'Cannes'],
  'United Kingdom': ['London', 'Manchester', 'Edinburgh', 'Birmingham', 'Glasgow', 'Liverpool', 'Oxford', 'Cambridge'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'Las Vegas', 'Washington D.C.', 'Boston', 'Orlando', 'Seattle'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Quebec City', 'Victoria'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Cairns'],
  'India': ['Delhi', 'Mumbai', 'Kolkata', 'Bengaluru', 'Chennai', 'Hyderabad', 'Jaipur', 'Agra', 'Goa', 'Kochi'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Taif', 'Abha'],
  'Indonesia': ['Bali (Denpasar)', 'Jakarta', 'Yogyakarta', 'Surabaya', 'Bandung', 'Lombok', 'Medan'],
  'Japan': ['Tokyo', 'Kyoto', 'Osaka', 'Sapporo', 'Fukuoka', 'Hiroshima', 'Nagoya', 'Yokohama'],
  'Germany': ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Dusseldorf', 'Stuttgart'],
  'Italy': ['Rome', 'Milan', 'Florence', 'Venice', 'Naples', 'Turin', 'Bologna'],
  'Spain': ['Madrid', 'Barcelona', 'Seville', 'Valencia', 'Malaga', 'Granada', 'Mallorca'],
  'Switzerland': ['Zurich', 'Geneva', 'Lucerne', 'Basel', 'Bern', 'Interlaken', 'Zermatt'],
  'Turkey': ['Istanbul', 'Antalya', 'Ankara', 'Izmir', 'Cappadocia (Nevsehir)', 'Bodrum'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Rayyan', 'Lusail', 'Al Khor'],
  'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur'],
  'Vietnam': ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hoi An', 'Nha Trang', 'Phu Quoc'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Sharm El Sheikh', 'Hurghada'],
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Jeju Island', 'Daegu'],
  'Bangladesh': ['Dhaka', 'Chattogram', 'Sylhet', 'Cox\'s Bazar', 'Khulna', 'Rajshahi', 'Barishal', 'Rangpur'],
};

let cachedCountries = null;

export async function fetchCountries() {
  if (cachedCountries && cachedCountries.length > 0) {
    return cachedCountries;
  }

  // Check LocalStorage cache
  try {
    const stored = localStorage.getItem('app_countries_cache');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedCountries = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore storage error
  }

  // Try FlagCDN API
  try {
    const res = await fetch('https://flagcdn.com/en/codes.json');
    if (res.ok) {
      const data = await res.json();
      const list = Object.entries(data)
        .map(([code, name]) => {
          const upperCode = code.toUpperCase();
          return {
            name,
            code: upperCode,
            flag: `https://flagcdn.com/w40/${code.toLowerCase()}.png`,
            svgFlag: `https://flagcdn.com/${code.toLowerCase()}.svg`,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      cachedCountries = list;
      try {
        localStorage.setItem('app_countries_cache', JSON.stringify(list));
      } catch {
        // ignore storage error
      }
      return list;
    }
  } catch (err) {
    console.warn('FlagCDN fetch failed, falling back to local country list:', err);
  }

  cachedCountries = FALLBACK_COUNTRIES;
  return FALLBACK_COUNTRIES;
}

export async function fetchCities(countryName) {
  if (!countryName) return [];

  // 1. Check curated mapping first
  const normalized = countryName.trim();
  const directMatch = COUNTRY_CITIES[normalized];
  if (directMatch && directMatch.length > 0) {
    return directMatch;
  }

  // Try partial or aliases match
  for (const [key, cities] of Object.entries(COUNTRY_CITIES)) {
    if (normalized.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(normalized.toLowerCase())) {
      return cities;
    }
  }

  // 2. Try fetching from countriesnow API
  try {
    const res = await fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: normalized }),
    });
    if (res.ok) {
      const result = await res.json();
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        return result.data.slice(0, 40); // Top 40 cities
      }
    }
  } catch (err) {
    console.warn('City API fetch failed:', err);
  }

  return [];
}
