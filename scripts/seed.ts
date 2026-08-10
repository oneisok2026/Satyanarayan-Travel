/**
 * Seeds demo catalogue content.
 *
 *   npm run seed          add/refresh demo content
 *   npm run seed -- --reset   wipe catalogue collections first
 *
 * Idempotent: every write is an upsert keyed on slug, so re-running does not
 * duplicate. User accounts, enquiries and bookings are never touched.
 */
import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';

loadEnvConfig(process.cwd());

const RESET = process.argv.includes('--reset');

// Unsplash source URLs — placeholders for demo content only. Replace with
// licensed agency photography before launch.
const IMG = (id: string, alt: string) => ({
  url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=70`,
  alt,
  width: 1600,
  height: 1067,
});

async function main(): Promise<void> {
  const {
    Destination,
    Category,
    TourPackage,
    BlogPost,
    GalleryItem,
    Service,
    SiteSetting,
  } = await import('../src/models/index');

  await mongoose.connect(process.env.MONGODB_URI as string, {
    dbName: process.env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 15_000,
  });

  console.log(`Seeding ${process.env.MONGODB_DB_NAME}…\n`);

  if (RESET) {
    console.log('--reset: clearing catalogue collections');
    await Promise.all([
      Destination.deleteMany({}),
      Category.deleteMany({}),
      TourPackage.deleteMany({}),
      BlogPost.deleteMany({}),
      GalleryItem.deleteMany({}),
      Service.deleteMany({}),
    ]);
  }

  // ---------------------------------------------------------- categories --
  const categories = [
    { name: 'Family Holidays', slug: 'family-holidays', icon: 'family', sortOrder: 1 },
    { name: 'Honeymoon', slug: 'honeymoon', icon: 'heart', sortOrder: 2 },
    { name: 'Adventure', slug: 'adventure', icon: 'mountain', sortOrder: 3 },
    { name: 'Pilgrimage', slug: 'pilgrimage', icon: 'temple', sortOrder: 4 },
    { name: 'Group Tours', slug: 'group-tours', icon: 'group', sortOrder: 5 },
    { name: 'Beach & Islands', slug: 'beach-islands', icon: 'beach', sortOrder: 6 },
  ];

  for (const category of categories) {
    await Category.updateOne(
      { slug: category.slug },
      { $set: { ...category, status: 'published', featured: category.sortOrder <= 3 } },
      { upsert: true },
    );
  }
  console.log(`  categories    ${categories.length}`);

  // -------------------------------------------------------- destinations --
  const destinations = [
    {
      name: 'Kashmir',
      slug: 'kashmir',
      type: 'domestic' as const,
      country: 'India',
      region: 'North India',
      shortDescription:
        'Alpine meadows, shikara rides on Dal Lake and snow-dusted pine valleys.',
      description:
        'Kashmir earns its reputation the moment the valley opens up below you. Srinagar sits around the still water of Dal Lake, where shikaras drift between houseboats at first light. Gulmarg climbs into meadows that turn white through winter, while Pahalgam follows the Lidder river through pine forest and open pasture. Spring brings tulips and almond blossom; autumn turns the chinars deep amber.',
      coverImage: IMG('1566837945700-30057527ade0', 'Shikara boats on Dal Lake, Kashmir'),
      bestTimeToVisit: 'March to October; December to February for snow',
      highlights: ['Dal Lake shikara ride', 'Gulmarg gondola', 'Pahalgam valleys', 'Mughal gardens', 'Tulip garden in spring'],
      featured: true,
      sortOrder: 1,
    },
    {
      name: 'Kerala',
      slug: 'kerala',
      type: 'domestic' as const,
      country: 'India',
      region: 'South India',
      shortDescription:
        'Backwater houseboats, tea-covered hills and long stretches of Arabian Sea coast.',
      description:
        'Kerala moves at the pace of its own waterways. Houseboats cross Vembanad Lake past villages that have farmed these banks for generations. Inland, Munnar rises into tea estates cut into steep hillsides, and Thekkady borders the Periyar reserve. The coast runs from the cliffs at Varkala to the quiet sand at Marari, with Kochi holding centuries of trade history in its streets.',
      coverImage: IMG('1602216056096-3b40cc0c9944', 'Houseboat on the Kerala backwaters'),
      bestTimeToVisit: 'September to March',
      highlights: ['Alleppey houseboat', 'Munnar tea estates', 'Periyar wildlife', 'Fort Kochi', 'Ayurvedic retreats'],
      featured: true,
      sortOrder: 2,
    },
    {
      name: 'Rajasthan',
      slug: 'rajasthan',
      type: 'domestic' as const,
      country: 'India',
      region: 'North India',
      shortDescription:
        'Desert forts, lake palaces and cities colour-coded in pink, blue and gold.',
      description:
        'Rajasthan is built for travellers who like their history standing up. Jaipur opens with the Amber Fort and the honeycomb façade of Hawa Mahal. Udaipur arranges itself around lakes and palace walls. Jodhpur spreads blue beneath Mehrangarh, and Jaisalmer rises out of the Thar as a living fort of yellow sandstone.',
      coverImage: IMG('1477587458883-47145ed94245', 'Hawa Mahal in Jaipur, Rajasthan'),
      bestTimeToVisit: 'October to March',
      highlights: ['Amber Fort', 'Udaipur lake palaces', 'Mehrangarh Fort', 'Thar desert camp', 'Jaisalmer fort'],
      featured: true,
      sortOrder: 3,
    },
    {
      name: 'Himachal Pradesh',
      slug: 'himachal-pradesh',
      type: 'domestic' as const,
      country: 'India',
      region: 'North India',
      shortDescription:
        'Colonial hill stations, apple orchards and high Himalayan passes.',
      description:
        'Himachal covers everything from gentle hill stations to serious mountain terrain. Shimla keeps its colonial architecture along the Ridge. Manali sits where the Beas valley narrows toward Rohtang. Dharamshala holds the Tibetan community above Kangra, and Spiti runs cold and high through villages built around centuries-old monasteries.',
      coverImage: IMG('1626621341517-bbf3d9990a23', 'Himalayan valley in Himachal Pradesh'),
      bestTimeToVisit: 'March to June; October to February for snow',
      highlights: ['Solang Valley', 'Rohtang Pass', 'McLeod Ganj', 'Shimla Ridge', 'Apple orchards'],
      featured: true,
      sortOrder: 4,
    },
    {
      name: 'Goa',
      slug: 'goa',
      type: 'domestic' as const,
      country: 'India',
      region: 'West India',
      shortDescription:
        'Beaches from busy to deserted, Portuguese churches and a long shoreline.',
      description:
        'Goa splits neatly in two. The north runs busy and social around Baga and Anjuna, with markets and beach shacks that stay open late. The south slows right down at Palolem and Agonda. Between them sit Old Goa\'s basilicas, spice plantations inland, and the Mandovi river cutting through the middle.',
      coverImage: IMG('1512343879784-a960bf40e7f2', 'Palm-lined beach in Goa'),
      bestTimeToVisit: 'November to February',
      highlights: ['North Goa beaches', 'Palolem and Agonda', 'Old Goa churches', 'Dudhsagar Falls', 'Spice plantations'],
      featured: false,
      sortOrder: 5,
    },
    {
      name: 'Andaman Islands',
      slug: 'andaman-islands',
      type: 'domestic' as const,
      country: 'India',
      region: 'Islands',
      shortDescription: 'Clear water, coral reefs and some of India\'s best diving.',
      description:
        'The Andamans sit far enough into the Bay of Bengal to feel genuinely remote. Havelock has the wide white sand of Radhanagar and easy access to reef diving. Neil Island is quieter again. Port Blair holds the colonial-era Cellular Jail, and the water throughout is clear enough that snorkelling needs no experience at all.',
      coverImage: IMG('1544551763-46a013bb70d5', 'Turquoise water at Radhanagar Beach'),
      bestTimeToVisit: 'October to May',
      highlights: ['Radhanagar Beach', 'Scuba diving', 'Cellular Jail', 'Neil Island', 'Glass-bottom boats'],
      featured: true,
      sortOrder: 6,
    },
    {
      name: 'Thailand',
      slug: 'thailand',
      type: 'international' as const,
      country: 'Thailand',
      region: 'Southeast Asia',
      shortDescription: 'Temple cities, limestone islands and reliably excellent food.',
      description:
        'Thailand is an easy first trip abroad and a rewarding repeat one. Bangkok stacks gilded temples against rooftop bars and canal markets. The south breaks into limestone islands around Krabi and Phuket. The north cools off at Chiang Mai, where the old city is ringed by a moat and surrounded by forested hills.',
      coverImage: IMG('1552465011-b4e21bf6e79a', 'Longtail boat among limestone cliffs, Thailand'),
      bestTimeToVisit: 'November to March',
      highlights: ['Grand Palace', 'Phi Phi Islands', 'Chiang Mai old city', 'Floating markets', 'Island hopping'],
      featured: true,
      sortOrder: 7,
    },
    {
      name: 'Dubai',
      slug: 'dubai',
      type: 'international' as const,
      country: 'United Arab Emirates',
      region: 'Middle East',
      shortDescription: 'Record-breaking towers, desert dunes and year-round sunshine.',
      description:
        'Dubai does scale without apology. The Burj Khalifa runs to 828 metres, the malls are destinations in themselves, and the desert starts twenty minutes from the skyline. Old Dubai survives around the creek, where abra boats still cross to the gold and spice souks for a couple of dirhams.',
      coverImage: IMG('1512453979798-5ea266f8880c', 'Dubai skyline with Burj Khalifa'),
      bestTimeToVisit: 'November to March',
      highlights: ['Burj Khalifa', 'Desert safari', 'Dubai Marina', 'Gold Souk', 'Palm Jumeirah'],
      featured: true,
      sortOrder: 8,
    },
    {
      name: 'Singapore',
      slug: 'singapore',
      type: 'international' as const,
      country: 'Singapore',
      region: 'Southeast Asia',
      shortDescription: 'A compact, green city that works — ideal for first-time travellers.',
      description:
        'Singapore packs a great deal into a small island and makes all of it easy to reach. Gardens by the Bay and the Marina Bay waterfront handle the spectacle. Sentosa covers the theme parks and beaches. Chinatown, Little India and Kampong Glam each keep their own character, and the hawker centres are as good as eating gets at the price.',
      coverImage: IMG('1525625293386-3f8f99389edd', 'Marina Bay waterfront, Singapore'),
      bestTimeToVisit: 'February to April',
      highlights: ['Gardens by the Bay', 'Universal Studios', 'Marina Bay Sands', 'Sentosa Island', 'Hawker centres'],
      featured: true,
      sortOrder: 9,
    },
    {
      name: 'Bali',
      slug: 'bali',
      type: 'international' as const,
      country: 'Indonesia',
      region: 'Southeast Asia',
      shortDescription: 'Rice terraces, cliffside temples and a long-running surf culture.',
      description:
        'Bali holds together as a destination because it offers several different holidays at once. Ubud sits inland among rice terraces and craft villages. The south coast runs from the surf at Uluwatu to the resorts of Nusa Dua. Temples like Tanah Lot and Besakih anchor the island\'s religious life, and the volcanoes inland are climbable before dawn.',
      coverImage: IMG('1537996194471-e657df975ab4', 'Rice terraces in Bali'),
      bestTimeToVisit: 'April to October',
      highlights: ['Ubud rice terraces', 'Tanah Lot temple', 'Nusa Penida', 'Mount Batur sunrise', 'Beach clubs'],
      featured: false,
      sortOrder: 10,
    },
  ];

  const destinationIds: Record<string, mongoose.Types.ObjectId> = {};

  for (const destination of destinations) {
    await Destination.updateOne(
      { slug: destination.slug },
      {
        $set: {
          ...destination,
          gallery: [destination.coverImage],
          status: 'published',
          seo: {
            title: `${destination.name} Tour Packages`,
            description: destination.shortDescription,
          },
        },
      },
      { upsert: true },
    );
    const saved = await Destination.findOne({ slug: destination.slug }).select('_id').lean();
    if (saved) destinationIds[destination.slug] = saved._id;
  }
  console.log(`  destinations  ${destinations.length}`);

  // ------------------------------------------------------------- packages --
  const categoryIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const category of categories) {
    const saved = await Category.findOne({ slug: category.slug }).select('_id').lean();
    if (saved) categoryIds[category.slug] = saved._id;
  }

  const packages = [
    {
      title: 'Kashmir Valley — Srinagar, Gulmarg & Pahalgam',
      slug: 'kashmir-valley-srinagar-gulmarg-pahalgam',
      type: 'domestic' as const,
      destinations: ['kashmir'],
      category: 'family-holidays',
      shortDescription:
        'Six days across the valley, with a houseboat night on Dal Lake and a day in the Gulmarg meadows.',
      description:
        'A straightforward first trip to Kashmir that covers the three places most people come for. Two nights in Srinagar include a houseboat stay and the Mughal gardens. Gulmarg adds the gondola and open meadow walks. Pahalgam finishes along the Lidder valley, with time for the Betaab and Aru valleys.',
      duration: { nights: 5, days: 6 },
      price: 28_500,
      compareAtPrice: 34_000,
      childPrice: 19_900,
      priceNote: 'per person on twin sharing',
      featured: true,
      inclusions: ['5 nights accommodation', 'Daily breakfast and dinner', 'One night houseboat stay', 'Private vehicle for all transfers and sightseeing', 'Gulmarg gondola phase 1', 'All tolls, parking and driver charges'],
      exclusions: ['Flights to and from Srinagar', 'Lunch and personal expenses', 'Pony rides and adventure activities', 'Travel insurance', 'Anything not listed under inclusions'],
      hotels: [
        { city: 'Srinagar', name: 'Deluxe hotel or houseboat', category: '3 star', nights: 3, roomType: 'Deluxe double' },
        { city: 'Gulmarg', name: 'Mountain resort', category: '3 star', nights: 1, roomType: 'Standard double' },
        { city: 'Pahalgam', name: 'Valley-view hotel', category: '3 star', nights: 1, roomType: 'Deluxe double' },
      ],
      transportation: 'Private air-conditioned vehicle throughout, sized to your group.',
      itinerary: [
        { day: 1, title: 'Arrive Srinagar — Dal Lake', description: 'Met at Srinagar airport and transferred to your hotel. Afternoon shikara ride on Dal Lake past the floating gardens. Evening free along the boulevard.', meals: ['Dinner'], accommodation: 'Srinagar', activities: ['Shikara ride', 'Boulevard walk'] },
        { day: 2, title: 'Mughal gardens and old city', description: 'Nishat, Shalimar and Chashme Shahi gardens in the morning, then Hazratbal shrine and the old city bazaars. Overnight on a houseboat.', meals: ['Breakfast', 'Dinner'], accommodation: 'Houseboat', activities: ['Mughal gardens', 'Old city bazaar'] },
        { day: 3, title: 'Srinagar to Gulmarg', description: 'Drive to Gulmarg through rice fields and pine forest. Gondola to Kongdoori, with free time in the meadows.', meals: ['Breakfast', 'Dinner'], accommodation: 'Gulmarg', activities: ['Gondola ride', 'Meadow walks'] },
        { day: 4, title: 'Gulmarg to Pahalgam', description: 'Scenic drive via Awantipora ruins and the saffron fields at Pampore. Afternoon free along the Lidder river.', meals: ['Breakfast', 'Dinner'], accommodation: 'Pahalgam', activities: ['Saffron fields', 'Riverside walk'] },
        { day: 5, title: 'Pahalgam valleys', description: 'Full day for Betaab Valley, Aru Valley and Chandanwari, with optional pony rides.', meals: ['Breakfast', 'Dinner'], accommodation: 'Pahalgam', activities: ['Betaab Valley', 'Aru Valley'] },
        { day: 6, title: 'Departure', description: 'Transfer to Srinagar airport with time for handicraft shopping en route.', meals: ['Breakfast'], activities: ['Shopping'] },
      ],
      coverImage: IMG('1566837945700-30057527ade0', 'Shikara boats on Dal Lake at sunset'),
    },
    {
      title: 'Kerala Backwaters & Hills — Munnar, Thekkady, Alleppey',
      slug: 'kerala-backwaters-hills-munnar-thekkady-alleppey',
      type: 'domestic' as const,
      destinations: ['kerala'],
      category: 'honeymoon',
      shortDescription:
        'Seven days from Kochi through tea country and spice hills to a night aboard a backwater houseboat.',
      description:
        'A classic Kerala circuit that works particularly well for couples. Begin in Fort Kochi, climb to the tea estates at Munnar, cross to the spice plantations and Periyar reserve at Thekkady, then finish on a private houseboat drifting the Alleppey backwaters.',
      duration: { nights: 6, days: 7 },
      price: 34_900,
      compareAtPrice: 41_000,
      childPrice: 24_400,
      priceNote: 'per couple on twin sharing',
      featured: true,
      inclusions: ['6 nights accommodation', 'Daily breakfast', 'One night private houseboat with all meals', 'Private vehicle throughout', 'Periyar boat safari', 'Kathakali performance in Kochi'],
      exclusions: ['Flights', 'Lunch and dinner except on houseboat', 'Monument entry fees', 'Ayurvedic treatments', 'Personal expenses'],
      hotels: [
        { city: 'Kochi', name: 'Heritage hotel', category: '3 star', nights: 1, roomType: 'Deluxe double' },
        { city: 'Munnar', name: 'Tea-estate resort', category: '4 star', nights: 2, roomType: 'Valley-view' },
        { city: 'Thekkady', name: 'Spice-plantation resort', category: '3 star', nights: 1, roomType: 'Deluxe double' },
        { city: 'Alleppey', name: 'Private houseboat', category: 'Premium', nights: 1, roomType: 'Air-conditioned bedroom' },
        { city: 'Kovalam', name: 'Beach resort', category: '4 star', nights: 1, roomType: 'Sea-view' },
      ],
      transportation: 'Private air-conditioned vehicle with an English-speaking driver.',
      itinerary: [
        { day: 1, title: 'Arrive Kochi', description: 'Airport pickup and transfer to Fort Kochi. Evening walk past the Chinese fishing nets, followed by a Kathakali performance.', meals: ['Breakfast'], accommodation: 'Kochi', activities: ['Fort Kochi walk', 'Kathakali'] },
        { day: 2, title: 'Kochi to Munnar', description: 'Drive into the hills, stopping at Cheeyappara falls and the first tea slopes.', meals: ['Breakfast'], accommodation: 'Munnar', activities: ['Waterfall stop', 'Tea estates'] },
        { day: 3, title: 'Munnar sightseeing', description: 'Eravikulam National Park, Mattupetty dam, the tea museum and Echo Point.', meals: ['Breakfast'], accommodation: 'Munnar', activities: ['Eravikulam', 'Tea museum'] },
        { day: 4, title: 'Munnar to Thekkady', description: 'Cross to Thekkady for a spice plantation tour and an optional boat safari on Periyar lake.', meals: ['Breakfast'], accommodation: 'Thekkady', activities: ['Spice plantation', 'Periyar safari'] },
        { day: 5, title: 'Thekkady to Alleppey houseboat', description: 'Board a private houseboat at noon and cruise the backwaters past village life. All meals aboard.', meals: ['Breakfast', 'Lunch', 'Dinner'], accommodation: 'Houseboat', activities: ['Backwater cruise'] },
        { day: 6, title: 'Alleppey to Kovalam', description: 'Disembark after breakfast and drive to the coast. Afternoon free on the beach.', meals: ['Breakfast'], accommodation: 'Kovalam', activities: ['Beach time'] },
        { day: 7, title: 'Departure', description: 'Transfer to Trivandrum airport.', meals: ['Breakfast'], activities: [] },
      ],
      coverImage: IMG('1602216056096-3b40cc0c9944', 'Houseboat on the Kerala backwaters'),
    },
    {
      title: 'Royal Rajasthan — Jaipur, Jodhpur & Udaipur',
      slug: 'royal-rajasthan-jaipur-jodhpur-udaipur',
      type: 'domestic' as const,
      destinations: ['rajasthan'],
      category: 'family-holidays',
      shortDescription:
        'Eight days across three cities of forts, lakes and desert palaces.',
      description:
        'The three-city Rajasthan circuit, paced so it does not become a march through monuments. Jaipur covers Amber Fort and the old pink city. Jodhpur is built around Mehrangarh and the blue houses beneath it. Udaipur closes the trip on the lakes, with a boat ride to Jag Mandir.',
      duration: { nights: 7, days: 8 },
      price: 42_500,
      childPrice: 29_750,
      priceNote: 'per person on twin sharing',
      featured: true,
      inclusions: ['7 nights accommodation', 'Daily breakfast', 'Private vehicle throughout', 'Local guides at each city', 'Elephant or jeep ride at Amber Fort', 'Boat ride on Lake Pichola'],
      exclusions: ['Flights', 'Monument entry fees', 'Lunch and dinner', 'Camera charges', 'Tips and personal expenses'],
      hotels: [
        { city: 'Jaipur', name: 'Heritage haveli', category: '4 star', nights: 3, roomType: 'Deluxe double' },
        { city: 'Jodhpur', name: 'Fort-view hotel', category: '3 star', nights: 2, roomType: 'Deluxe double' },
        { city: 'Udaipur', name: 'Lake-view hotel', category: '4 star', nights: 2, roomType: 'Lake-view double' },
      ],
      transportation: 'Private air-conditioned sedan or SUV depending on group size.',
      itinerary: [
        { day: 1, title: 'Arrive Jaipur', description: 'Airport pickup, hotel check-in and an evening visit to Birla Mandir.', meals: ['Breakfast'], accommodation: 'Jaipur', activities: ['Temple visit'] },
        { day: 2, title: 'Amber Fort and city palace', description: 'Amber Fort in the morning, then Jal Mahal, City Palace, Jantar Mantar and Hawa Mahal.', meals: ['Breakfast'], accommodation: 'Jaipur', activities: ['Amber Fort', 'City Palace'] },
        { day: 3, title: 'Jaipur bazaars', description: 'Morning at Nahargarh Fort, afternoon free in Johari and Bapu bazaars.', meals: ['Breakfast'], accommodation: 'Jaipur', activities: ['Nahargarh', 'Bazaar shopping'] },
        { day: 4, title: 'Jaipur to Jodhpur', description: 'Drive via the Ajmer and Pushkar area, arriving Jodhpur by evening.', meals: ['Breakfast'], accommodation: 'Jodhpur', activities: ['Pushkar stop'] },
        { day: 5, title: 'Jodhpur sightseeing', description: 'Mehrangarh Fort, Jaswant Thada and the blue-city lanes below the ramparts.', meals: ['Breakfast'], accommodation: 'Jodhpur', activities: ['Mehrangarh', 'Blue city walk'] },
        { day: 6, title: 'Jodhpur to Udaipur', description: 'Drive via the Ranakpur Jain temples, arriving Udaipur in the afternoon.', meals: ['Breakfast'], accommodation: 'Udaipur', activities: ['Ranakpur temples'] },
        { day: 7, title: 'Udaipur lakes and palaces', description: 'City Palace, Saheliyon ki Bari and a sunset boat ride on Lake Pichola.', meals: ['Breakfast'], accommodation: 'Udaipur', activities: ['City Palace', 'Boat ride'] },
        { day: 8, title: 'Departure', description: 'Transfer to Udaipur airport.', meals: ['Breakfast'], activities: [] },
      ],
      coverImage: IMG('1477587458883-47145ed94245', 'Hawa Mahal facade in Jaipur'),
    },
    {
      title: 'Himachal Hills — Shimla & Manali',
      slug: 'himachal-hills-shimla-manali',
      type: 'domestic' as const,
      destinations: ['himachal-pradesh'],
      category: 'adventure',
      shortDescription:
        'Seven days through colonial Shimla and the Beas valley at Manali, with a day at Solang.',
      description:
        'A dependable Himachal itinerary for first-timers. Shimla covers the Ridge, Mall Road and the toy-train landscape. Manali follows with Solang Valley, Hadimba temple and the old town, plus an optional run up to Rohtang when the pass is open.',
      duration: { nights: 6, days: 7 },
      price: 24_900,
      compareAtPrice: 29_500,
      childPrice: 17_400,
      priceNote: 'per person on twin sharing',
      featured: false,
      inclusions: ['6 nights accommodation', 'Daily breakfast and dinner', 'Private vehicle from Chandigarh', 'Solang Valley excursion', 'All tolls and driver charges'],
      exclusions: ['Rohtang Pass permit and vehicle', 'Adventure activities', 'Lunch', 'Personal expenses', 'Travel insurance'],
      hotels: [
        { city: 'Shimla', name: 'Hill-view hotel', category: '3 star', nights: 2, roomType: 'Deluxe double' },
        { city: 'Manali', name: 'Riverside resort', category: '3 star', nights: 3, roomType: 'Deluxe double' },
        { city: 'Chandigarh', name: 'Business hotel', category: '3 star', nights: 1, roomType: 'Standard double' },
      ],
      transportation: 'Private vehicle from Chandigarh, returning to Chandigarh or Delhi.',
      itinerary: [
        { day: 1, title: 'Chandigarh to Shimla', description: 'Pickup at Chandigarh and drive into the hills. Evening walk on the Mall.', meals: ['Dinner'], accommodation: 'Shimla', activities: ['Mall Road'] },
        { day: 2, title: 'Shimla and Kufri', description: 'Kufri excursion, Jakhoo temple and the Ridge.', meals: ['Breakfast', 'Dinner'], accommodation: 'Shimla', activities: ['Kufri', 'Jakhoo temple'] },
        { day: 3, title: 'Shimla to Manali', description: 'Long scenic drive along the Beas, stopping at Kullu for river views.', meals: ['Breakfast', 'Dinner'], accommodation: 'Manali', activities: ['Kullu valley'] },
        { day: 4, title: 'Solang Valley', description: 'Full day at Solang with optional paragliding, zorbing and ropeway.', meals: ['Breakfast', 'Dinner'], accommodation: 'Manali', activities: ['Solang Valley'] },
        { day: 5, title: 'Manali local', description: 'Hadimba temple, Vashisht hot springs, Manu temple and Old Manali.', meals: ['Breakfast', 'Dinner'], accommodation: 'Manali', activities: ['Hadimba temple', 'Old Manali'] },
        { day: 6, title: 'Manali to Chandigarh', description: 'Return drive with photo stops along the valley.', meals: ['Breakfast', 'Dinner'], accommodation: 'Chandigarh', activities: [] },
        { day: 7, title: 'Departure', description: 'Transfer to Chandigarh airport or railway station.', meals: ['Breakfast'], activities: [] },
      ],
      coverImage: IMG('1626621341517-bbf3d9990a23', 'Snow-covered Himalayan valley'),
    },
    {
      title: 'Goa Beach Break',
      slug: 'goa-beach-break',
      type: 'domestic' as const,
      destinations: ['goa'],
      category: 'beach-islands',
      shortDescription: 'Four easy days split between north Goa beaches and Old Goa heritage.',
      description:
        'A short break that does not try to do too much. Two days on the north Goa beaches with a cruise on the Mandovi, one day for Old Goa\'s basilicas and the spice plantations inland, and a final morning free before departure.',
      duration: { nights: 3, days: 4 },
      price: 16_900,
      childPrice: 11_800,
      priceNote: 'per person on twin sharing',
      featured: true,
      inclusions: ['3 nights beach-side accommodation', 'Daily breakfast', 'Airport transfers', 'North Goa sightseeing', 'Mandovi river cruise'],
      exclusions: ['Flights', 'Water sports', 'Lunch and dinner', 'Entry fees', 'Personal expenses'],
      hotels: [{ city: 'North Goa', name: 'Beach resort', category: '3 star', nights: 3, roomType: 'Deluxe double' }],
      transportation: 'Air-conditioned vehicle for transfers and sightseeing.',
      itinerary: [
        { day: 1, title: 'Arrive Goa', description: 'Airport pickup and transfer to your beach resort. Evening free at Baga or Calangute.', meals: ['Breakfast'], accommodation: 'North Goa', activities: ['Beach time'] },
        { day: 2, title: 'North Goa and river cruise', description: 'Fort Aguada, Sinquerim and Anjuna, followed by a sunset cruise on the Mandovi.', meals: ['Breakfast'], accommodation: 'North Goa', activities: ['Fort Aguada', 'River cruise'] },
        { day: 3, title: 'Old Goa and spice plantation', description: 'Basilica of Bom Jesus, Se Cathedral and a spice plantation lunch inland.', meals: ['Breakfast'], accommodation: 'North Goa', activities: ['Old Goa churches', 'Spice plantation'] },
        { day: 4, title: 'Departure', description: 'Morning free, then transfer to the airport.', meals: ['Breakfast'], activities: [] },
      ],
      coverImage: IMG('1512343879784-a960bf40e7f2', 'Palm trees on a Goa beach'),
    },
    {
      title: 'Andaman Islands — Port Blair, Havelock & Neil',
      slug: 'andaman-islands-port-blair-havelock-neil',
      type: 'domestic' as const,
      destinations: ['andaman-islands'],
      category: 'beach-islands',
      shortDescription:
        'Six days across three islands, with Radhanagar Beach and reef snorkelling included.',
      description:
        'The standard Andaman circuit, run at a comfortable pace. Port Blair covers the Cellular Jail and its light-and-sound show. Havelock delivers Radhanagar and Elephant Beach with snorkelling over live coral. Neil Island adds Bharatpur and Laxmanpur before the return ferry.',
      duration: { nights: 5, days: 6 },
      price: 38_900,
      childPrice: 27_200,
      priceNote: 'per person on twin sharing',
      featured: true,
      inclusions: ['5 nights accommodation', 'Daily breakfast', 'All ferry tickets between islands', 'Snorkelling at Elephant Beach', 'All transfers and sightseeing', 'Cellular Jail light and sound show'],
      exclusions: ['Flights to Port Blair', 'Scuba diving', 'Lunch and dinner', 'Island entry permits', 'Personal expenses'],
      hotels: [
        { city: 'Port Blair', name: 'City hotel', category: '3 star', nights: 2, roomType: 'Deluxe double' },
        { city: 'Havelock', name: 'Beach resort', category: '3 star', nights: 2, roomType: 'Cottage' },
        { city: 'Neil Island', name: 'Island resort', category: '3 star', nights: 1, roomType: 'Standard double' },
      ],
      transportation: 'Private vehicles on each island plus air-conditioned inter-island ferries.',
      itinerary: [
        { day: 1, title: 'Arrive Port Blair', description: 'Airport pickup, Corbyn\'s Cove beach, then the Cellular Jail light and sound show.', meals: ['Breakfast'], accommodation: 'Port Blair', activities: ['Cellular Jail'] },
        { day: 2, title: 'Ferry to Havelock', description: 'Morning ferry to Havelock. Afternoon at Radhanagar Beach for sunset.', meals: ['Breakfast'], accommodation: 'Havelock', activities: ['Radhanagar Beach'] },
        { day: 3, title: 'Elephant Beach snorkelling', description: 'Boat to Elephant Beach for snorkelling over the reef. Afternoon free.', meals: ['Breakfast'], accommodation: 'Havelock', activities: ['Snorkelling'] },
        { day: 4, title: 'Havelock to Neil Island', description: 'Ferry to Neil. Bharatpur and Laxmanpur beaches, plus the natural coral bridge.', meals: ['Breakfast'], accommodation: 'Neil Island', activities: ['Natural bridge'] },
        { day: 5, title: 'Neil to Port Blair', description: 'Return ferry, then Ross Island and the Chatham saw mill.', meals: ['Breakfast'], accommodation: 'Port Blair', activities: ['Ross Island'] },
        { day: 6, title: 'Departure', description: 'Transfer to Port Blair airport.', meals: ['Breakfast'], activities: [] },
      ],
      coverImage: IMG('1544551763-46a013bb70d5', 'Clear turquoise water at Radhanagar Beach'),
    },
    {
      title: 'Thailand Explorer — Bangkok, Pattaya & Phuket',
      slug: 'thailand-explorer-bangkok-pattaya-phuket',
      type: 'international' as const,
      destinations: ['thailand'],
      category: 'group-tours',
      shortDescription:
        'Seven days across the capital, the Pattaya coast and the Phi Phi islands.',
      description:
        'A first trip to Thailand covering city, coast and islands. Bangkok handles the temples and markets, Pattaya adds Coral Island, and Phuket closes with a full-day Phi Phi cruise. Visa assistance is included.',
      duration: { nights: 6, days: 7 },
      price: 62_900,
      compareAtPrice: 74_000,
      childPrice: 44_000,
      priceNote: 'per person on twin sharing, excluding airfare',
      featured: true,
      inclusions: ['6 nights accommodation', 'Daily breakfast', 'Airport and inter-city transfers', 'Coral Island tour with lunch', 'Phi Phi Islands day cruise', 'Bangkok city tour', 'Visa assistance'],
      exclusions: ['International flights', 'Thailand visa fee', 'Lunch and dinner except where stated', 'Optional tours and shows', 'Travel insurance'],
      hotels: [
        { city: 'Bangkok', name: 'City hotel', category: '4 star', nights: 2, roomType: 'Superior double' },
        { city: 'Pattaya', name: 'Beach hotel', category: '4 star', nights: 2, roomType: 'Deluxe double' },
        { city: 'Phuket', name: 'Resort near Patong', category: '4 star', nights: 2, roomType: 'Deluxe double' },
      ],
      transportation: 'Air-conditioned coach transfers plus domestic flight Bangkok to Phuket.',
      itinerary: [
        { day: 1, title: 'Arrive Bangkok', description: 'Airport pickup and transfer. Evening free at Asiatique riverfront.', meals: ['Breakfast'], accommodation: 'Bangkok', activities: ['Asiatique'] },
        { day: 2, title: 'Bangkok city and temples', description: 'Grand Palace, Wat Pho and Wat Arun, then a canal boat through Thonburi.', meals: ['Breakfast'], accommodation: 'Bangkok', activities: ['Grand Palace', 'Canal tour'] },
        { day: 3, title: 'Bangkok to Pattaya', description: 'Transfer to Pattaya, stopping at the Sriracha tiger zoo. Evening on Walking Street.', meals: ['Breakfast'], accommodation: 'Pattaya', activities: ['Walking Street'] },
        { day: 4, title: 'Coral Island', description: 'Speedboat to Coral Island for swimming and optional water sports, with lunch on the beach.', meals: ['Breakfast', 'Lunch'], accommodation: 'Pattaya', activities: ['Coral Island'] },
        { day: 5, title: 'Pattaya to Phuket', description: 'Domestic flight to Phuket and transfer to your resort. Evening at Patong.', meals: ['Breakfast'], accommodation: 'Phuket', activities: ['Patong Beach'] },
        { day: 6, title: 'Phi Phi Islands cruise', description: 'Full-day cruise to Phi Phi with snorkelling stops and lunch aboard.', meals: ['Breakfast', 'Lunch'], accommodation: 'Phuket', activities: ['Phi Phi Islands', 'Snorkelling'] },
        { day: 7, title: 'Departure', description: 'Transfer to Phuket airport.', meals: ['Breakfast'], activities: [] },
      ],
      coverImage: IMG('1552465011-b4e21bf6e79a', 'Longtail boat among Thai limestone cliffs'),
    },
    {
      title: 'Dubai Highlights',
      slug: 'dubai-highlights',
      type: 'international' as const,
      destinations: ['dubai'],
      category: 'family-holidays',
      shortDescription:
        'Five days covering Burj Khalifa, a desert safari and a day at Abu Dhabi.',
      description:
        'Dubai\'s main attractions in five days without rushing. Burj Khalifa at level 124, a dune safari with barbecue dinner, the Dubai Mall aquarium, and a full day across to Abu Dhabi for the Sheikh Zayed Grand Mosque.',
      duration: { nights: 4, days: 5 },
      price: 58_500,
      childPrice: 41_000,
      priceNote: 'per person on twin sharing, excluding airfare',
      featured: true,
      inclusions: ['4 nights accommodation', 'Daily breakfast', 'Burj Khalifa level 124 ticket', 'Desert safari with barbecue dinner', 'Dubai city tour', 'Abu Dhabi day trip', 'Visa assistance'],
      exclusions: ['International flights', 'UAE visa fee', 'Lunch and dinner except on safari', 'Optional attractions', 'Travel insurance'],
      hotels: [{ city: 'Dubai', name: 'City hotel', category: '4 star', nights: 4, roomType: 'Superior double' }],
      transportation: 'Air-conditioned coach for all tours and transfers.',
      itinerary: [
        { day: 1, title: 'Arrive Dubai', description: 'Airport pickup and hotel check-in. Evening free at Dubai Marina.', meals: ['Breakfast'], accommodation: 'Dubai', activities: ['Dubai Marina'] },
        { day: 2, title: 'City tour and Burj Khalifa', description: 'Jumeirah Mosque, Dubai Museum and the creek abra crossing, then Burj Khalifa at level 124.', meals: ['Breakfast'], accommodation: 'Dubai', activities: ['Burj Khalifa', 'Gold Souk'] },
        { day: 3, title: 'Desert safari', description: 'Morning free at Dubai Mall and the aquarium. Afternoon dune bashing, camel ride and barbecue dinner with entertainment.', meals: ['Breakfast', 'Dinner'], accommodation: 'Dubai', activities: ['Desert safari'] },
        { day: 4, title: 'Abu Dhabi day trip', description: 'Full day to Abu Dhabi for the Sheikh Zayed Grand Mosque, Corniche and Emirates Palace.', meals: ['Breakfast'], accommodation: 'Dubai', activities: ['Grand Mosque'] },
        { day: 5, title: 'Departure', description: 'Transfer to Dubai airport.', meals: ['Breakfast'], activities: [] },
      ],
      coverImage: IMG('1512453979798-5ea266f8880c', 'Dubai skyline at dusk'),
    },
    {
      title: 'Singapore & Bali Combo',
      slug: 'singapore-bali-combo',
      type: 'international' as const,
      destinations: ['singapore', 'bali'],
      category: 'honeymoon',
      shortDescription:
        'Eight days pairing Singapore\'s city attractions with Bali\'s beaches and rice terraces.',
      description:
        'Two very different destinations in one trip. Singapore covers Sentosa, Gardens by the Bay and the Night Safari. Bali follows with Ubud\'s rice terraces, the cliffside temple at Uluwatu, and beach time in the south.',
      duration: { nights: 7, days: 8 },
      price: 79_900,
      compareAtPrice: 92_000,
      childPrice: 55_900,
      priceNote: 'per person on twin sharing, excluding airfare',
      featured: false,
      inclusions: ['7 nights accommodation', 'Daily breakfast', 'Singapore city tour with Gardens by the Bay', 'Sentosa island pass', 'Bali Kintamani and Ubud tour', 'Uluwatu temple with Kecak dance', 'All transfers'],
      exclusions: ['International and inter-country flights', 'Visa fees', 'Lunch and dinner', 'Optional tours', 'Travel insurance'],
      hotels: [
        { city: 'Singapore', name: 'City hotel', category: '4 star', nights: 3, roomType: 'Deluxe double' },
        { city: 'Ubud', name: 'Rice-terrace resort', category: '4 star', nights: 2, roomType: 'Garden villa' },
        { city: 'Nusa Dua', name: 'Beach resort', category: '4 star', nights: 2, roomType: 'Deluxe double' },
      ],
      transportation: 'Private transfers throughout, plus a Singapore to Bali flight.',
      itinerary: [
        { day: 1, title: 'Arrive Singapore', description: 'Airport pickup and transfer. Evening at Marina Bay for the light show.', meals: ['Breakfast'], accommodation: 'Singapore', activities: ['Marina Bay'] },
        { day: 2, title: 'Singapore city and Gardens', description: 'City tour, Merlion Park and Gardens by the Bay domes.', meals: ['Breakfast'], accommodation: 'Singapore', activities: ['Gardens by the Bay'] },
        { day: 3, title: 'Sentosa Island', description: 'Full day on Sentosa with cable car, S.E.A. Aquarium and the beaches.', meals: ['Breakfast'], accommodation: 'Singapore', activities: ['Sentosa'] },
        { day: 4, title: 'Fly to Bali — Ubud', description: 'Flight to Denpasar and transfer to Ubud. Evening at the Ubud art market.', meals: ['Breakfast'], accommodation: 'Ubud', activities: ['Ubud market'] },
        { day: 5, title: 'Kintamani and rice terraces', description: 'Tegalalang rice terraces, a coffee plantation and Mount Batur views from Kintamani.', meals: ['Breakfast'], accommodation: 'Ubud', activities: ['Rice terraces', 'Kintamani'] },
        { day: 6, title: 'Ubud to Nusa Dua', description: 'Transfer south, stopping at Uluwatu temple for the sunset Kecak dance.', meals: ['Breakfast'], accommodation: 'Nusa Dua', activities: ['Uluwatu temple'] },
        { day: 7, title: 'Nusa Dua beach day', description: 'Free day for the beach or optional water sports at Tanjung Benoa.', meals: ['Breakfast'], accommodation: 'Nusa Dua', activities: ['Beach day'] },
        { day: 8, title: 'Departure', description: 'Transfer to Denpasar airport.', meals: ['Breakfast'], activities: [] },
      ],
      coverImage: IMG('1525625293386-3f8f99389edd', 'Marina Bay waterfront at night'),
    },
    {
      title: 'Char Dham Yatra — Uttarakhand',
      slug: 'char-dham-yatra-uttarakhand',
      type: 'domestic' as const,
      destinations: ['himachal-pradesh'],
      category: 'pilgrimage',
      shortDescription:
        'Eleven days covering Yamunotri, Gangotri, Kedarnath and Badrinath.',
      description:
        'The complete Char Dham circuit from Haridwar, run with experienced drivers who know the mountain roads. Includes assistance with the Kedarnath trek arrangements and overnight halts chosen to keep daily driving manageable.',
      duration: { nights: 10, days: 11 },
      price: 46_500,
      childPrice: 32_550,
      priceNote: 'per person on twin sharing',
      featured: false,
      inclusions: ['10 nights accommodation', 'All meals', 'Private vehicle from Haridwar', 'Driver allowance, tolls and parking', 'Assistance with Kedarnath trek arrangements'],
      exclusions: ['Helicopter tickets', 'Pony or palanquin charges', 'Personal expenses', 'Any temple donations', 'Travel insurance'],
      hotels: [
        { city: 'Barkot', name: 'Pilgrim lodge', category: 'Standard', nights: 2, roomType: 'Double' },
        { city: 'Uttarkashi', name: 'Riverside lodge', category: 'Standard', nights: 2, roomType: 'Double' },
        { city: 'Guptkashi', name: 'Hill lodge', category: 'Standard', nights: 2, roomType: 'Double' },
        { city: 'Badrinath', name: 'Temple-side lodge', category: 'Standard', nights: 2, roomType: 'Double' },
        { city: 'Haridwar', name: 'City hotel', category: '3 star', nights: 2, roomType: 'Double' },
      ],
      transportation: 'Private vehicle with a driver experienced on hill routes.',
      itinerary: [
        { day: 1, title: 'Haridwar arrival', description: 'Arrive Haridwar and attend the evening Ganga aarti at Har Ki Pauri.', meals: ['Dinner'], accommodation: 'Haridwar', activities: ['Ganga aarti'] },
        { day: 2, title: 'Haridwar to Barkot', description: 'Drive via Mussoorie and Kempty Falls to Barkot.', meals: ['Breakfast', 'Dinner'], accommodation: 'Barkot', activities: ['Kempty Falls'] },
        { day: 3, title: 'Yamunotri', description: 'Drive to Janki Chatti and trek 6 km to Yamunotri temple, returning to Barkot.', meals: ['Breakfast', 'Dinner'], accommodation: 'Barkot', activities: ['Yamunotri darshan'] },
        { day: 4, title: 'Barkot to Uttarkashi', description: 'Drive to Uttarkashi and visit Vishwanath temple.', meals: ['Breakfast', 'Dinner'], accommodation: 'Uttarkashi', activities: ['Vishwanath temple'] },
        { day: 5, title: 'Gangotri', description: 'Drive to Gangotri for darshan, returning to Uttarkashi by evening.', meals: ['Breakfast', 'Dinner'], accommodation: 'Uttarkashi', activities: ['Gangotri darshan'] },
        { day: 6, title: 'Uttarkashi to Guptkashi', description: 'Long drive via Tehri dam to Guptkashi.', meals: ['Breakfast', 'Dinner'], accommodation: 'Guptkashi', activities: ['Tehri dam'] },
        { day: 7, title: 'Kedarnath', description: 'Drive to Sonprayag and trek or take a pony to Kedarnath for darshan.', meals: ['Breakfast', 'Dinner'], accommodation: 'Kedarnath', activities: ['Kedarnath darshan'] },
        { day: 8, title: 'Return to Guptkashi', description: 'Morning darshan, then descend and drive to Guptkashi.', meals: ['Breakfast', 'Dinner'], accommodation: 'Guptkashi', activities: [] },
        { day: 9, title: 'Guptkashi to Badrinath', description: 'Drive via Joshimath to Badrinath. Evening aarti at the temple.', meals: ['Breakfast', 'Dinner'], accommodation: 'Badrinath', activities: ['Badrinath aarti'] },
        { day: 10, title: 'Badrinath to Rudraprayag', description: 'Morning darshan and Mana village visit, then drive down to Rudraprayag.', meals: ['Breakfast', 'Dinner'], accommodation: 'Rudraprayag', activities: ['Mana village'] },
        { day: 11, title: 'Return to Haridwar', description: 'Drive to Haridwar for departure.', meals: ['Breakfast'], activities: [] },
      ],
      coverImage: IMG('1626621341517-bbf3d9990a23', 'Himalayan temple valley'),
    },
  ];

  for (const pkg of packages) {
    const { destinations: destSlugs, category: catSlug, ...rest } = pkg;
    await TourPackage.updateOne(
      { slug: pkg.slug },
      {
        $set: {
          ...rest,
          destinationIds: destSlugs.map((slug) => destinationIds[slug]).filter(Boolean),
          categoryId: categoryIds[catSlug],
          gallery: [pkg.coverImage],
          status: 'published',
          seo: {
            title: pkg.title,
            description: pkg.shortDescription,
          },
        },
      },
      { upsert: true },
    );
  }
  console.log(`  packages      ${packages.length}`);

  // ------------------------------------------------------------- services --
  const services = [
    {
      name: 'Hotel Booking',
      slug: 'hotel-booking',
      shortDescription:
        'Rooms negotiated at rates we hold directly with the properties we use.',
      description:
        'We book hotels across India and abroad, from budget guesthouses to five-star resorts. Because we work with these properties regularly, we can usually secure better rates than public booking sites, and we can vouch for the rooms we place you in. Tell us your dates, budget and preferred area, and we will come back with two or three options.',
      icon: 'hotel',
      features: ['Negotiated rates', 'Verified properties', 'Free cancellation on most bookings', 'Group and corporate rates', 'Airport transfer arrangement', 'On-trip support'],
      enquiryFields: ['city', 'checkIn', 'checkOut', 'rooms', 'hotelCategory'],
      sortOrder: 1,
      featured: true,
    },
    {
      name: 'Car Rental',
      slug: 'car-rental',
      shortDescription:
        'Chauffeur-driven vehicles for airport runs, day trips and full itineraries.',
      description:
        'Our fleet covers hatchbacks through to tempo travellers, all with experienced drivers who know the routes. Available by the hour, the day or for a complete multi-city itinerary. Every vehicle is insured and maintained, and rates include tolls, parking and driver allowance so there are no additions at the end of the trip.',
      icon: 'car',
      features: ['Chauffeur-driven', 'Hatchback to tempo traveller', 'Airport and railway transfers', 'Outstation packages', 'All tolls and parking included', 'GPS-tracked vehicles'],
      enquiryFields: ['pickupCity', 'pickupDate', 'vehicleType', 'duration'],
      sortOrder: 2,
      featured: true,
    },
    {
      name: 'E-Ticket Booking',
      slug: 'e-ticket-booking',
      shortDescription: 'Flight, rail and bus ticketing with fare comparison and support.',
      description:
        'We book domestic and international flights, rail and bus tickets, and we handle the parts that go wrong: reschedules, cancellations, refunds and airline correspondence. If a fare drops or a better routing exists, we will tell you before ticketing rather than after.',
      icon: 'ticket',
      features: ['Domestic and international flights', 'Rail and bus ticketing', 'Fare comparison before booking', 'Reschedule and cancellation handling', 'Group fares', 'Web check-in assistance'],
      enquiryFields: ['from', 'to', 'departDate', 'returnDate', 'passengers', 'travelClass'],
      sortOrder: 3,
      featured: true,
    },
  ];

  for (const service of services) {
    await Service.updateOne(
      { slug: service.slug },
      {
        $set: {
          ...service,
          status: 'published',
          seo: { title: service.name, description: service.shortDescription },
        },
      },
      { upsert: true },
    );
  }
  console.log(`  services      ${services.length}`);

  // ----------------------------------------------------------------- blog --
  const posts = [
    {
      title: 'When to Visit Kashmir: A Month-by-Month Guide',
      slug: 'when-to-visit-kashmir-month-by-month',
      excerpt:
        'Tulips in April, meadows through summer, chinars turning in October and snow from December. Here is what each season actually looks like.',
      category: 'Destination Guides',
      tags: ['kashmir', 'seasons', 'planning'],
      readingMinutes: 6,
      coverImage: IMG('1566837945700-30057527ade0', 'Dal Lake in Kashmir'),
      content: `<p>Kashmir is one of the few Indian destinations where the season changes the trip entirely. The same itinerary in April and in December produces two different holidays.</p>
<h2>March to May</h2><p>Spring is the valley at its most photographed. The Indira Gandhi Tulip Garden opens for roughly three weeks from late March with over a million bulbs in bloom, and almond blossom covers Badamwari. Days run 15-25°C. This is peak season, so book accommodation early.</p>
<h2>June to August</h2><p>Summer suits families and anyone escaping the plains. Gulmarg and Pahalgam stay in the low twenties while Delhi bakes. The gondola runs reliably, meadows are fully green, and the higher valleys open up for walking.</p>
<h2>September to November</h2><p>Autumn is the connoisseur's season. The chinar trees turn deep red and gold through October, crowds thin considerably, and the light is at its best for photography. Nights get cold from late October.</p>
<h2>December to February</h2><p>Winter turns Gulmarg into a genuine ski destination with reliable powder. Srinagar can drop below freezing and Dal Lake sometimes ices at the edges. Some higher roads close, so itineraries need flexibility.</p>
<h2>Our recommendation</h2><p>For a first visit, late September to mid-October gives the best combination of weather, colour and manageable crowds.</p>`,
    },
    {
      title: 'Kerala Houseboats: What to Know Before You Book',
      slug: 'kerala-houseboats-what-to-know-before-booking',
      excerpt:
        'Not all houseboats are equal. Here is how the categories differ, where to board, and what a night on the backwaters is actually like.',
      category: 'Travel Tips',
      tags: ['kerala', 'houseboat', 'planning'],
      readingMinutes: 5,
      coverImage: IMG('1602216056096-3b40cc0c9944', 'Houseboat on Kerala backwaters'),
      content: `<p>A night on a Kerala houseboat is the image most people carry of the state, and it lives up to it — provided you book the right boat.</p>
<h2>Categories</h2><p>Boats are graded deluxe, premium and luxury, and the difference is real. Deluxe boats have functional air conditioning that typically runs only at night. Premium adds better bedding, an upper deck and longer AC hours. Luxury boats offer larger cabins, proper lounges and full-day air conditioning.</p>
<h2>Where to board</h2><p>Alleppey is the standard departure point with the widest choice. Kumarakom is quieter and better for birdlife. Both cruise the same Vembanad system.</p>
<h2>The routine</h2><p>Boarding is around noon, cruising through the afternoon past villages and paddy fields. Boats anchor before sunset — night navigation is prohibited — and remain moored until morning. Lunch, dinner and breakfast are cooked aboard, usually including fresh karimeen.</p>
<h2>Practical notes</h2><p>One night is enough for most travellers. Mosquito repellent is worth carrying. Vegetarian and Jain food is available with advance notice. Boats operate year-round; monsoon cruising is atmospheric if you do not mind the rain.</p>`,
    },
    {
      title: 'First Trip Abroad: Thailand, Dubai or Singapore?',
      slug: 'first-trip-abroad-thailand-dubai-singapore',
      excerpt:
        'Three destinations that work well for first-time international travellers, compared on cost, visa process and ease of getting around.',
      category: 'Destination Guides',
      tags: ['international', 'thailand', 'dubai', 'singapore'],
      readingMinutes: 7,
      coverImage: IMG('1552465011-b4e21bf6e79a', 'Longtail boat in Thailand'),
      content: `<p>These three come up in almost every conversation about a first trip abroad. Each suits a different traveller.</p>
<h2>Thailand — best value</h2><p>The cheapest of the three once you land. Visa on arrival is straightforward for Indian passport holders. Food is excellent and inexpensive, transport is cheap, and the variety between Bangkok, the islands and the north is considerable. Best for travellers who want the most trip for the money.</p>
<h2>Dubai — easiest logistics</h2><p>A four-hour flight, no jet lag, and a large Indian community meaning familiar food everywhere. Everything is new, air-conditioned and efficient. The visa is processed quickly. It is the most expensive per day of the three, and summer is genuinely too hot. Best for families and short breaks.</p>
<h2>Singapore — best for families with children</h2><p>Compact, spotlessly clean and extremely easy to navigate on public transport. Sentosa and Universal Studios anchor a family trip. English is universal. Costs sit between Thailand and Dubai. Best for first-timers nervous about travelling abroad.</p>
<h2>Short answer</h2><p>Budget-conscious: Thailand. Travelling with young children: Singapore. Short luxury break: Dubai.</p>`,
    },
    {
      title: 'Packing for the Himalayas: A Practical List',
      slug: 'packing-for-the-himalayas-practical-list',
      excerpt:
        'What to actually carry for a Himachal or Uttarakhand trip, by season — and what you can safely leave at home.',
      category: 'Travel Tips',
      tags: ['himalaya', 'packing', 'himachal'],
      readingMinutes: 4,
      coverImage: IMG('1626621341517-bbf3d9990a23', 'Himalayan mountain valley'),
      content: `<p>Mountain weather changes faster than plains weather, and the single most common packing mistake is bringing one heavy jacket instead of several light layers.</p>
<h2>Layering</h2><p>Three layers beat one thick coat: a thermal base, a fleece or light down mid-layer, and a windproof outer shell. You can shed layers as you descend and add them at altitude.</p>
<h2>Footwear</h2><p>Closed shoes with grip. Trainers are fine for Shimla and Manali town; anything involving Solang snow or a Kedarnath trek needs proper boots with ankle support.</p>
<h2>Always carry</h2><p>Sunscreen — UV at altitude is far stronger than most people expect, even in cold weather. Sunglasses for snow glare. Lip balm. A refillable water bottle. Any prescription medication in your hand luggage.</p>
<h2>Altitude</h2><p>For anything above 3,000 metres, ascend gradually and drink more water than feels necessary. Diamox is worth discussing with your doctor before a Spiti or Kedarnath trip.</p>
<h2>Leave behind</h2><p>Heavy suitcases — mountain roads and hotel stairs make wheeled luggage a burden. A duffel or backpack is far easier.</p>`,
    },
  ];

  const publishedFrom = Date.now() - posts.length * 7 * 86_400_000;

  for (const [index, post] of posts.entries()) {
    await BlogPost.updateOne(
      { slug: post.slug },
      {
        $set: {
          ...post,
          authorName: 'Satyanarayan Tour & Travel PVT. LTD.',
          status: 'published',
          publishedAt: new Date(publishedFrom + index * 7 * 86_400_000),
          seo: { title: post.title, description: post.excerpt },
        },
      },
      { upsert: true },
    );
  }
  console.log(`  blog posts    ${posts.length}`);

  // -------------------------------------------------------------- gallery --
  const gallery = [
    { album: 'Kashmir', img: IMG('1566837945700-30057527ade0', 'Shikara boats moored on Dal Lake'), caption: 'Morning on Dal Lake' },
    { album: 'Kashmir', img: IMG('1626621341517-bbf3d9990a23', 'Snow-covered valley in Kashmir'), caption: 'Gulmarg in winter' },
    { album: 'Kerala', img: IMG('1602216056096-3b40cc0c9944', 'Houseboat on the backwaters'), caption: 'Alleppey backwaters' },
    { album: 'Kerala', img: IMG('1593693411515-c20261bcad6e', 'Tea plantation slopes in Munnar'), caption: 'Munnar tea estates' },
    { album: 'Rajasthan', img: IMG('1477587458883-47145ed94245', 'Hawa Mahal in Jaipur'), caption: 'Hawa Mahal, Jaipur' },
    { album: 'Rajasthan', img: IMG('1524230572899-a752b3835840', 'Fort architecture in Rajasthan'), caption: 'Desert forts' },
    { album: 'Beaches', img: IMG('1512343879784-a960bf40e7f2', 'Palm trees on a Goa beach'), caption: 'Goa shoreline' },
    { album: 'Beaches', img: IMG('1544551763-46a013bb70d5', 'Clear water at Radhanagar Beach'), caption: 'Radhanagar, Andamans' },
    { album: 'International', img: IMG('1512453979798-5ea266f8880c', 'Dubai skyline'), caption: 'Dubai at dusk' },
    { album: 'International', img: IMG('1552465011-b4e21bf6e79a', 'Thai longtail boat'), caption: 'Krabi, Thailand' },
    { album: 'International', img: IMG('1525625293386-3f8f99389edd', 'Marina Bay in Singapore'), caption: 'Marina Bay, Singapore' },
    { album: 'International', img: IMG('1537996194471-e657df975ab4', 'Bali rice terraces'), caption: 'Tegalalang, Bali' },
  ];

  for (const [index, item] of gallery.entries()) {
    const albumSlug = item.album.toLowerCase().replace(/\s+/g, '-');
    await GalleryItem.updateOne(
      { albumSlug, 'image.url': item.img.url },
      {
        $set: {
          album: item.album,
          albumSlug,
          image: item.img,
          caption: item.caption,
          sortOrder: index,
          status: 'published',
        },
      },
      { upsert: true },
    );
  }
  console.log(`  gallery       ${gallery.length}`);

  // ------------------------------------------------------------- settings --
  const settings = [
    { key: 'company.name', value: 'Satyanarayan Tour & Travel PVT. LTD.', group: 'company', isPublic: true },
    { key: 'company.tagline', value: 'Journeys planned by people who have made them', group: 'company', isPublic: true },
    { key: 'company.foundedYear', value: 2009, group: 'company', isPublic: true },
    { key: 'stats.travellers', value: 12000, group: 'stats', isPublic: true },
    { key: 'stats.destinations', value: 45, group: 'stats', isPublic: true },
    { key: 'stats.yearsExperience', value: 16, group: 'stats', isPublic: true },
  ];

  for (const setting of settings) {
    await SiteSetting.updateOne(
      { key: setting.key },
      { $set: setting },
      { upsert: true },
    );
  }
  console.log(`  settings      ${settings.length}`);

  console.log('\nSeed complete.');
  console.log('NOTE: images are Unsplash placeholders — replace with licensed');
  console.log('agency photography before launch.\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
