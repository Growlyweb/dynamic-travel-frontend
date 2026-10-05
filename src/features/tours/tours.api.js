import { apiClient, withMock, withMockList } from '../../services/apiClient'

const DEMO_TOURS = [
  {
    id: 'tour_205',
    name: "Cox's Bazar Beach Escape",
    country: 'Bangladesh',
    destination: "Cox's Bazar, Bangladesh",
    durationDays: 3,
    priceCurrency: 'BDT',
    price: 12500,
    b2bPrice: 10000,
    seats: 25,
    status: 'published',
    rating: 4.9,
    coverImage: 'https://picsum.photos/seed/coxs-bazar/900/560',
    gallery: [],
    description: 'Experience the world longest natural sea beach with luxury resort stay and fresh seafood.',
    included: ['2 nights hotel stay', 'Breakfast included', 'Beach tour & sunset view'],
    excluded: ['Personal expenses', 'Shopping'],
    hotels: ['Ocean Paradise Hotel & Resort'],
    itinerary: [
      { day: 1, title: 'Arrival & Beach Sunset', description: 'Check-in, relax at Laboni Beach, enjoy sunset.' },
      { day: 2, title: 'Inani Beach & Himchari', description: 'Day trip to Inani rocky beach and Himchari waterfall.' },
      { day: 3, title: 'Departure', description: 'Morning shopping at Burmese market, airport transfer.' },
    ],
    terms: 'Standard cancellation rules apply.',
  },
  {
    id: 'tour_206',
    name: 'Sylhet Tea Garden Experience',
    country: 'Bangladesh',
    destination: 'Sylhet, Bangladesh',
    durationDays: 2,
    priceCurrency: 'BDT',
    price: 8500,
    b2bPrice: 6800,
    seats: 20,
    status: 'draft',
    rating: 4.8,
    coverImage: 'https://picsum.photos/seed/sylhet-tea/900/560',
    gallery: [],
    description: 'Lush green tea gardens, Jaflong stone collection and Ratargul swamp forest tour.',
    included: ['1 night resort stay', 'Boat ride at Ratargul & Jaflong', 'All local transfers'],
    excluded: ['Personal shopping'],
    hotels: ['Grand Sultan Tea Resort'],
    itinerary: [
      { day: 1, title: 'Ratargul & Tea Gardens', description: 'Boat safari in Ratargul freshwater swamp forest, evening tea tasting.' },
      { day: 2, title: 'Jaflong & Departure', description: 'Visit Zero Point Jaflong and Khasia village, return transfer.' },
    ],
    terms: 'Standard cancellation rules apply.',
  },
  {
    id: 'tour_201',
    name: 'Bali Escape',
    country: 'Indonesia',
    destination: 'Bali, Indonesia',
    durationDays: 7,
    price: 1450,
    b2bPrice: 1180,
    seats: 18,
    status: 'published',
    rating: 4.8,
    coverImage: 'https://picsum.photos/seed/bali-escape/900/560',
    gallery: [
      'https://picsum.photos/seed/bali-1/600/400',
      'https://picsum.photos/seed/bali-2/600/400',
      'https://picsum.photos/seed/bali-3/600/400',
    ],
    description:
      'Seven days across Ubud and Seminyak: rice terraces, temple mornings, a volcano sunrise trek and two lazy beach days to finish.',
    included: [
      '6 nights accommodation with breakfast',
      'All airport and hotel transfers',
      'English-speaking guide throughout',
      'Volcano sunrise trek with breakfast box',
      'Kecak dance tickets at Uluwatu',
    ],
    excluded: ['International flights', 'Travel insurance', 'Bali tourist visa fee', 'Personal expenses and tips'],
    hotels: [
      'Ubud: Puri Sebali Resort or Similar',
      'Seminyak: The Sangrah Villas or Similar',
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Denpasar', description: 'Airport pickup, transfer to Ubud resort and a free evening to settle in.' },
      { day: 2, title: 'Ubud temples & rice terraces', description: 'Tirta Empul water temple, Tegalalang rice terraces and a Balinese cooking class.' },
      { day: 3, title: 'Mount Batur sunrise trek', description: 'Pre-dawn hike up Mount Batur, breakfast at the summit and a hot-spring stop on the way down.' },
      { day: 4, title: 'Transfer to Seminyak', description: 'Scenic drive via Jatiluwih terraces, check-in at the beach hotel, sunset at Tanah Lot.' },
      { day: 5, title: 'Beach & Uluwatu', description: 'Free beach morning, Kecak fire dance at Uluwatu cliff temple and a seafood dinner on Jimbaran bay.' },
      { day: 6, title: 'Free day', description: 'Optional snorkeling trip to Nusa Penida or a spa day — the day is yours.' },
      { day: 7, title: 'Departure', description: 'Transfer to the airport for your flight home.' },
    ],
    terms:
      'Free cancellation up to 14 days before departure; 50% charge within 14 days, no refund within 72 hours.\nA 30% deposit confirms the booking; the balance is due 21 days before departure.\nPrices are per person on twin-sharing basis.',
  },
  {
    id: 'tour_202',
    name: 'Swiss Alps Explorer',
    country: 'Switzerland',
    destination: 'Zurich, Switzerland',
    durationDays: 5,
    price: 2210,
    b2bPrice: 1850,
    seats: 12,
    status: 'published',
    rating: 4.6,
    coverImage: 'https://picsum.photos/seed/swiss-alps/900/560',
    gallery: [
      'https://picsum.photos/seed/alps-1/600/400',
      'https://picsum.photos/seed/alps-2/600/400',
      'https://picsum.photos/seed/alps-3/600/400',
    ],
    description:
      'Five days of peaks and panoramas: Lucerne, Interlaken and the Jungfraujoch — the top of Europe — with scenic rail between every stop.',
    included: [
      '4 nights in 4-star hotels with breakfast',
      'Swiss Travel Pass (2nd class) for all rail journeys',
      'Jungfraujoch excursion with guide',
      'Lake Lucerne cruise',
    ],
    excluded: ['Flights to/from Zurich', 'Lunches and dinners', 'Optional cable cars not listed'],
    hotels: [
      'Lucerne: Hotel Astoria or Similar',
      'Interlaken: Hotel Interlaken or Similar',
    ],
    itinerary: [
      { day: 1, title: 'Arrive Zurich', description: 'Meet at the airport, transfer to Lucerne and an evening walk across Chapel Bridge.' },
      { day: 2, title: 'Lucerne & lake cruise', description: 'Old-town tour, Lion Monument and a paddle-steamer cruise on Lake Lucerne.' },
      { day: 3, title: 'Interlaken', description: 'Scenic rail to Interlaken, free afternoon for paragliding or lakeside walks.' },
      { day: 4, title: 'Jungfraujoch — Top of Europe', description: 'Cogwheel train to the Sphinx observatory, ice palace and glacier views at 3,454 m.' },
      { day: 5, title: 'Departure', description: 'Return rail to Zurich and airport transfer.' },
    ],
    terms:
      'Full payment due at booking; free cancellation up to 21 days before departure.\nSwiss Travel Pass is non-transferable once issued.\nItinerary may shift by a day in case of extreme mountain weather.',
  },
  {
    id: 'tour_203',
    name: 'Dubai City Break',
    country: 'UAE',
    destination: 'Dubai, UAE',
    durationDays: 4,
    price: 980,
    b2bPrice: 790,
    seats: 24,
    status: 'draft',
    rating: 4.4,
    coverImage: 'https://picsum.photos/seed/dubai-break/900/560',
    gallery: [
      'https://picsum.photos/seed/dubai-1/600/400',
      'https://picsum.photos/seed/dubai-2/600/400',
    ],
    description:
      'A long weekend of skylines and desert: Burj Khalifa at sunset, a dhow dinner cruise, a morning desert safari and old-Dubai souks.',
    included: ['3 nights hotel with breakfast', 'Burj Khalifa 124th-floor tickets', 'Desert safari with BBQ dinner', 'Dhow dinner cruise'],
    excluded: ['Flights', 'UAE visa', 'Personal expenses'],
    hotels: ['Dubai: Rove Downtown or Similar'],
    itinerary: [
      { day: 1, title: 'Arrival & marina walk', description: 'Airport pickup, evening stroll around Dubai Marina.' },
      { day: 2, title: 'Old & new Dubai', description: 'Souks, Dubai Frame and Burj Khalifa at sunset with fountain show.' },
      { day: 3, title: 'Desert safari', description: 'Dune bashing, camel ride and BBQ dinner under the stars.' },
      { day: 4, title: 'Departure', description: 'Free morning for shopping, then airport transfer.' },
    ],
    terms: '50% deposit confirms booking, balance due 10 days before arrival.\nRates not valid during UAE public holidays and expo periods.',
  },
  {
    id: 'tour_204',
    name: 'Nepal Himalaya Trek',
    country: 'Nepal',
    destination: 'Kathmandu & Pokhara, Nepal',
    durationDays: 10,
    price: 890,
    b2bPrice: 720,
    seats: 15,
    status: 'published',
    rating: 4.9,
    coverImage: 'https://picsum.photos/seed/nepal-trek/900/560',
    gallery: [
      'https://picsum.photos/seed/nepal-1/600/400',
      'https://picsum.photos/seed/nepal-2/600/400',
      'https://picsum.photos/seed/nepal-3/600/400',
    ],
    description:
      'Ten unforgettable days across the roof of the world — Kathmandu temples, the Annapurna foothills and sunrise over Phewa Lake.',
    included: [
      '9 nights accommodation (hotels + teahouses)',
      'All meals during trek',
      'Licensed trekking guide & porter',
      'Domestic Kathmandu–Pokhara flight',
      'All national park entry permits',
    ],
    excluded: ['International flights', 'Nepal visa fee', 'Travel insurance', 'Tips'],
    hotels: [
      'Kathmandu: Hotel Thamel Eco Resort or Similar',
      'Pokhara: Temple Tree Resort or Similar',
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Kathmandu', description: 'Airport pickup and welcome dinner in Thamel.' },
      { day: 2, title: 'Kathmandu Valley sightseeing', description: 'Pashupatinath, Boudhanath stupa and Durbar Square.' },
      { day: 3, title: 'Fly to Pokhara', description: '25-minute mountain flight, lakeside afternoon.' },
      { day: 4, title: 'Trek begins — Nayapul to Tikhedhunga', description: '4–5 hours through terraced rice fields and waterfalls.' },
      { day: 5, title: 'Tikhedhunga to Ghorepani', description: 'Climb through rhododendron forests to 2,874 m.' },
      { day: 6, title: 'Poon Hill sunrise (3,210 m)', description: 'Pre-dawn hike for panoramic Annapurna and Dhaulagiri views.' },
      { day: 7, title: 'Trek to Tadapani', description: 'Beautiful ridge walk through lush forest.' },
      { day: 8, title: 'Descent to Ghandruk', description: 'Gurung cultural village and museum visit.' },
      { day: 9, title: 'Return to Pokhara', description: 'Drive back, free lakeside evening.' },
      { day: 10, title: 'Departure from Kathmandu', description: 'Morning flight to Kathmandu and international departure.' },
    ],
    terms:
      'Booking requires 25% deposit; balance due 30 days before departure.\nTrek itinerary may be adjusted due to weather or altitude conditions.\nTravel insurance with emergency evacuation cover is mandatory.',
  },
  {
    id: 'tour_205',
    name: 'Everest Base Camp Classic',
    country: 'Nepal',
    destination: 'Lukla & EBC, Nepal',
    durationDays: 14,
    price: 1650,
    b2bPrice: 1350,
    seats: 10,
    status: 'published',
    rating: 5.0,
    coverImage: 'https://picsum.photos/seed/ebc-trek/900/560',
    gallery: [
      'https://picsum.photos/seed/ebc-1/600/400',
      'https://picsum.photos/seed/ebc-2/600/400',
    ],
    description:
      'The world\'s most iconic trek: through Sherpa villages, towering icefall and up to 5,364 m at the foot of Everest.',
    included: [
      '13 nights teahouse accommodation',
      'All meals on trek (breakfast, lunch, dinner)',
      'Experienced Sherpa guide & porter',
      'Kathmandu–Lukla flights (both ways)',
      'Sagarmatha National Park permit & TIMS card',
    ],
    excluded: ['International flights', 'Nepal visa', 'Travel insurance', 'Extra snacks & drinks', 'Tips'],
    hotels: ['Kathmandu: 3-star hotel (2 nights)', 'EBC route: teahouses throughout'],
    itinerary: [
      { day: 1, title: 'Fly Kathmandu to Lukla (2,860 m)', description: 'Thrilling Tenzing-Hillary Airport landing, trek to Phakding.' },
      { day: 2, title: 'Phakding to Namche Bazaar (3,440 m)', description: 'Cross the famous Hillary Suspension Bridge.' },
      { day: 3, title: 'Acclimatisation at Namche', description: 'Short hike for altitude adaptation, Everest viewpoint.' },
      { day: 4, title: 'Namche to Tengboche (3,860 m)', description: 'Rhododendron forest and the famous monastery.' },
      { day: 5, title: 'Tengboche to Dingboche (4,410 m)', description: 'Enter the high-altitude moonscape.' },
      { day: 6, title: 'Acclimatisation at Dingboche', description: 'Hike to Nangkartshang peak for panoramic views.' },
      { day: 7, title: 'Dingboche to Lobuche (4,940 m)', description: 'Walk past the Khumbu Glacier moraines.' },
      { day: 8, title: 'Lobuche to EBC (5,364 m) & Gorak Shep', description: 'Reach Everest Base Camp — the summit of the trek!' },
      { day: 9, title: 'Kala Patthar (5,545 m) sunrise', description: 'Best close-up view of Everest at sunrise.' },
      { day: 10, title: 'Descent to Pheriche', description: 'Begin the journey back down.' },
      { day: 11, title: 'Pheriche to Namche', description: 'Longer day descending quickly.' },
      { day: 12, title: 'Namche to Lukla', description: 'Final trekking day through familiar valleys.' },
      { day: 13, title: 'Fly back to Kathmandu', description: 'Rest, shopping and farewell dinner.' },
      { day: 14, title: 'International departure', description: 'Airport transfer and depart.' },
    ],
    terms:
      'Full payment required 45 days before departure.\nNo refund within 30 days; 50% refund 31–60 days before departure.\nParticipants must be in good physical condition; consult your doctor.',
  },
  {
    id: 'tour_206',
    name: 'Thailand Island Hopper',
    country: 'Thailand',
    destination: 'Bangkok & Krabi, Thailand',
    durationDays: 8,
    price: 1120,
    b2bPrice: 900,
    seats: 20,
    status: 'published',
    rating: 4.7,
    coverImage: 'https://picsum.photos/seed/thailand-island/900/560',
    gallery: [
      'https://picsum.photos/seed/thailand-1/600/400',
      'https://picsum.photos/seed/thailand-2/600/400',
      'https://picsum.photos/seed/thailand-3/600/400',
    ],
    description:
      'Eight days of temples, street food, limestone cliffs and turquoise waters — from Bangkok buzz to Krabi serenity.',
    included: [
      '7 nights accommodation with breakfast',
      'Bangkok city tour & Grand Palace entry',
      'Ferry transfers to Phi Phi & Railay Beach',
      'Snorkeling trip with equipment',
      'Domestic Bangkok–Krabi flight',
    ],
    excluded: ['International flights', 'Thai e-visa', 'Meals not listed', 'Tips'],
    hotels: [
      'Bangkok: Ibis Styles Silom or Similar',
      'Krabi: Ao Nang Cliff Beach Resort or Similar',
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Bangkok', description: 'Hotel check-in, evening Khao San Road experience.' },
      { day: 2, title: 'Bangkok temples & canals', description: 'Grand Palace, Wat Pho, Chao Phraya river cruise.' },
      { day: 3, title: 'Bangkok street food & markets', description: 'Chatuchak weekend market and evening street-food tour.' },
      { day: 4, title: 'Fly to Krabi', description: '1h domestic flight, afternoon beach relaxation at Ao Nang.' },
      { day: 5, title: 'Four Islands snorkeling tour', description: 'Full-day longtail boat trip with snorkeling at coral reefs.' },
      { day: 6, title: 'Railay Beach by longtail', description: 'Limestone caves, rock climbing and lagoon swimming.' },
      { day: 7, title: 'Phi Phi Islands day trip', description: 'Ferry to Maya Bay, Viking Cave and snorkeling coves.' },
      { day: 8, title: 'Departure from Krabi', description: 'Airport transfer and international departure.' },
    ],
    terms:
      '30% deposit at booking; balance due 21 days before departure.\nFerry schedules subject to sea conditions.\nAll prices per person on twin-sharing basis.',
  },
  {
    id: 'tour_207',
    name: 'Bangkok & Chiang Mai Duo',
    country: 'Thailand',
    destination: 'Bangkok & Chiang Mai, Thailand',
    durationDays: 6,
    price: 750,
    b2bPrice: 610,
    seats: 22,
    status: 'published',
    rating: 4.5,
    coverImage: 'https://picsum.photos/seed/chiang-mai/900/560',
    gallery: [
      'https://picsum.photos/seed/chiangmai-1/600/400',
      'https://picsum.photos/seed/chiangmai-2/600/400',
    ],
    description:
      'Six days between Bangkok\'s modern skyline and Chiang Mai\'s ancient temples, night markets and elephant sanctuary.',
    included: [
      '5 nights accommodation with breakfast',
      'Elephant Nature Park half-day visit',
      'Doi Inthanon National Park tour',
      'Bangkok–Chiang Mai overnight train (sleeper)',
    ],
    excluded: ['International flights', 'Meals not listed', 'Personal shopping'],
    hotels: [
      'Bangkok: D&D Inn Khaosan or Similar',
      'Chiang Mai: Tamarind Village or Similar',
    ],
    itinerary: [
      { day: 1, title: 'Arrival Bangkok', description: 'Settle in and explore the night markets.' },
      { day: 2, title: 'Bangkok highlights', description: 'Temples, Tuk-tuk tour and rooftop bar sunset.' },
      { day: 3, title: 'Overnight train to Chiang Mai', description: 'Scenic sleeper train through the Thai countryside.' },
      { day: 4, title: 'Elephant sanctuary & old city', description: 'Morning at ethical elephant sanctuary, evening Lanna temples.' },
      { day: 5, title: 'Doi Inthanon day trip', description: 'Thailand\'s highest peak, waterfalls and royal pagodas.' },
      { day: 6, title: 'Departure from Chiang Mai', description: 'Free morning at Warorot Market, airport transfer.' },
    ],
    terms: 'Full payment 14 days before departure. Train berths non-refundable once issued.',
  },
]

// Mutable so mock-mode create/update/remove actually persist for the session.
let toursStore = DEMO_TOURS.map((tour) => ({ ...tour }))

const DEMO_CUSTOM_TOURS = [
  {
    id: 'ct_1',
    customer: 'Jane & Mark Doyle',
    phone: '+880 1712 556 340',
    destination: 'Maldives',
    travelers: 2,
    startDate: '2026-11-10',
    endDate: '2026-11-16',
    requestedAt: '2026-09-29',
    status: 'pending',
    hotel: 'resort',
    transportation: 'Flight',
    activities: ['Beach day', 'Snorkeling / diving'],
    requirements: 'Overwater villa, anniversary dinner on the beach.',
    itinerary: [
      { day: 1, title: 'Arrival in Malé & speedboat transfer', description: 'Arrival, transfer to the resort and sunset welcome dinner.' },
      { day: 2, title: 'Snorkeling / diving', description: 'House-reef snorkeling trip with a marine guide.' },
      { day: 3, title: 'Rest & local time', description: 'Spa afternoon and sandbank picnic.' },
      { day: 4, title: 'Beach day', description: 'Full day on a private sandbank with beach games.' },
      { day: 5, title: 'Rest & local time', description: 'Free day for the pool, spa or optional add-ons.' },
      { day: 6, title: 'Sunset dolphin cruise', description: 'Evening dolphin cruise with canapés.' },
      { day: 7, title: 'Departure', description: 'Speedboat to Malé and flight home.' },
    ],
  },
  {
    id: 'ct_2',
    customer: 'Nimbus Labs',
    phone: '+880 1977 402 118',
    destination: 'Goa, India',
    travelers: 34,
    startDate: '2026-12-05',
    endDate: '2026-12-08',
    requestedAt: '2026-09-27',
    status: 'quoted',
    hotel: '4-star',
    transportation: 'Minibus',
    activities: ['Beach day', 'Food tour', 'Water sports'],
    requirements: 'Team-building activities on day 2, vegetarian catering.',
    itinerary: [
      { day: 1, title: 'Arrival in Goa', description: 'Minibus transfer to the hotel, welcome dinner.' },
      { day: 2, title: 'Beach day', description: 'Team-building games on the beach followed by a BBQ evening.' },
      { day: 3, title: 'Food tour', description: 'Guided Goan street-food trail in Panjim and Fontainhas.' },
      { day: 4, title: 'Departure', description: 'Check-out and transfer to the airport.' },
    ],
  },
]
let customStore = DEMO_CUSTOM_TOURS.map((request) => ({ ...request }))

function nextId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
}

export const toursApi = {
  list: (params) => withMockList(toursStore, params, { searchKeys: ['name', 'destination', 'country'] }),
  get: (id) =>
    withMock(toursStore.find((tour) => tour.id === id) ?? toursStore[0], () => apiClient.get(`/tours/${id}`)),
  create: (payload) =>
    withMock(
      () => {
        const record = { rating: 0, seats: 0, status: 'draft', ...payload, id: nextId('tour') }
        toursStore = [record, ...toursStore]
        return JSON.parse(JSON.stringify(record))
      },
      () => apiClient.post('/tours', payload),
    ),
  update: (id, payload) =>
    withMock(
      () => {
        const index = toursStore.findIndex((tour) => tour.id === id)
        const current = index >= 0 ? toursStore[index] : toursStore[0]
        const updated = { ...current, ...payload }
        if (index >= 0) toursStore = toursStore.map((tour) => (tour.id === id ? updated : tour))
        return JSON.parse(JSON.stringify(updated))
      },
      () => apiClient.patch(`/tours/${id}`, payload),
    ),
  remove: (id) =>
    withMock(
      () => {
        toursStore = toursStore.filter((tour) => tour.id !== id)
        return { ok: true }
      },
      () => apiClient.del(`/tours/${id}`),
    ),

  listCustom: (params) => withMockList(customStore, params, { searchKeys: ['name', 'customer', 'destination'] }),
  createCustom: (payload) =>
    withMock(
      () => {
        const record = {
          status: 'pending',
          requestedAt: new Date().toISOString().slice(0, 10),
          ...payload,
          id: nextId('ct'),
        }
        customStore = [record, ...customStore]
        return JSON.parse(JSON.stringify(record))
      },
      () => apiClient.post('/tours/custom', payload),
    ),
  updateCustom: (id, payload) =>
    withMock(
      () => {
        const index = customStore.findIndex((c) => c.id === id)
        if (index >= 0) {
          customStore[index] = { ...customStore[index], ...payload }
          return JSON.parse(JSON.stringify(customStore[index]))
        }
        return null
      },
      () => apiClient.patch(`/tours/custom/${id}`, payload),
    ),
}

