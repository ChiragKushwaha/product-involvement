import type { CategoryCode, Platform, Situation } from '@/types/survey';

/**
 * The eight search situations published at
 * sites.google.com/view/research-on-search/multiple-situations
 *
 * Naming follows the source site: (h) = high-involvement framing,
 * (l) = low-involvement framing; L/F/H/D = laptop / footwear /
 * higher-learning / drinks. Scenario text is reproduced verbatim.
 */

const PLATFORMS: Record<CategoryCode, Record<string, Platform>> = {
  L: {
    flipkart: { id: 'flipkart', name: 'Flipkart', domain: 'flipkart.com', tint: 'butter' },
    amazon: { id: 'amazon', name: 'Amazon', domain: 'amazon.in', tint: 'blush' },
    myntra: { id: 'myntra', name: 'Myntra', domain: 'myntra.com', tint: 'peri' },
    croma: { id: 'croma', name: 'Croma', domain: 'croma.com', tint: 'sky' },
    reliancedigital: {
      id: 'reliancedigital',
      name: 'Reliance Digital',
      domain: 'reliancedigital.in',
      tint: 'sage',
    },
  },
  F: {
    flipkart: { id: 'flipkart', name: 'Flipkart', domain: 'flipkart.com', tint: 'butter' },
    amazon: { id: 'amazon', name: 'Amazon', domain: 'amazon.in', tint: 'blush' },
    myntra: { id: 'myntra', name: 'Myntra', domain: 'myntra.com', tint: 'peri' },
    ajio: { id: 'ajio', name: 'AJIO', domain: 'ajio.com', tint: 'sky' },
    nykaafashion: {
      id: 'nykaafashion',
      name: 'Nykaa Fashion',
      domain: 'nykaafashion.com',
      tint: 'sage',
    },
  },
  H: {
    coursera: { id: 'coursera', name: 'Coursera', domain: 'coursera.org', tint: 'peri' },
    edx: { id: 'edx', name: 'edX', domain: 'edx.org', tint: 'sky' },
    udemy: { id: 'udemy', name: 'Udemy', domain: 'udemy.com', tint: 'blush' },
    linkedinlearning: {
      id: 'linkedinlearning',
      name: 'LinkedIn Learning',
      domain: 'linkedin.com/learning',
      tint: 'sage',
    },
    swayam: { id: 'swayam', name: 'SWAYAM', domain: 'swayam.gov.in', tint: 'butter' },
  },
  D: {
    blinkit: { id: 'blinkit', name: 'Blinkit', domain: 'blinkit.com', tint: 'butter' },
    zomato: { id: 'zomato', name: 'Zomato', domain: 'zomato.com', tint: 'blush' },
    zepto: { id: 'zepto', name: 'Zepto', domain: 'zeptonow.com', tint: 'peri' },
    swiggyinstamart: {
      id: 'swiggyinstamart',
      name: 'Swiggy Instamart',
      domain: 'swiggy.com/instamart',
      tint: 'sage',
    },
    bigbasket: { id: 'bigbasket', name: 'bigbasket', domain: 'bigbasket.com', tint: 'sky' },
  },
};

const CAREFUL = 'Please carefully read the following introductory text.';
const PLAIN = 'Please read the following introductory text.';

export const SITUATIONS: Situation[] = [
  {
    id: 'situation-1',
    code: 'Ad 1',
    number: 1,
    siteSlug: '1-search-situation-hl',
    siteLabel: 'Search Situation (h)L',
    involvement: 'high',
    categoryCode: 'L',
    category: 'Laptop',
    headline: 'A laptop for your exams',
    prompt: CAREFUL,
    scenario:
      'Your exams are very close, so you will need your own laptop for tests and project work. Since buying a laptop costs a lot of money, choose it carefully. Make sure it has MS Office, a 14–15-inch screen, at least 16 GB of RAM, and at least 4 hours of battery life, within the price range of ₹40,000-80,000. Read reviews, compare different brands, and select a laptop that is reliable and gives good value for your money.',
    accent: 'peri',
    platforms: [
      PLATFORMS.L.flipkart,
      PLATFORMS.L.amazon,
      PLATFORMS.L.myntra,
      PLATFORMS.L.croma,
      PLATFORMS.L.reliancedigital,
    ],
    videoSrc: '/ads/ad-1.mp4',
    adScript: {
      tagline: 'Built for exam season.',
      beats: [
        '16 GB RAM. 14–15 inch screen.',
        'MS Office included.',
        'All-day battery life.',
        '₹40,000 – ₹80,000.',
        'Compare. Read reviews. Choose well.',
      ],
    },
  },
  {
    id: 'situation-2',
    code: 'Ad 2',
    number: 2,
    siteSlug: '2-search-situation-ll',
    siteLabel: 'Search Situation (l)L',
    involvement: 'low',
    categoryCode: 'L',
    category: 'Laptop',
    headline: 'A laptop of your own',
    prompt: PLAIN,
    scenario:
      'Your exams and important assignments are coming soon, so you need a laptop for online tests and submitting projects. Borrowing one again and again is not convenient, so you have decided to buy your own. Since a laptop is a long-term purchase and not something you replace often, it is wise to invest in a good-quality one.',
    accent: 'lilac',
    platforms: [
      PLATFORMS.L.flipkart,
      PLATFORMS.L.amazon,
      PLATFORMS.L.myntra,
      PLATFORMS.L.reliancedigital,
      PLATFORMS.L.croma,
    ],
    videoSrc: '/ads/ad-2.mp4',
    adScript: {
      tagline: 'Your own laptop. Finally.',
      beats: [
        'No more borrowing.',
        'Ready for every online test.',
        'A long-term buy.',
        'Worth investing in.',
      ],
    },
  },
  {
    id: 'situation-3',
    code: 'Ad 3',
    number: 3,
    siteSlug: '3-search-situation-hf',
    siteLabel: 'Search Situation (h)F',
    involvement: 'high',
    categoryCode: 'F',
    category: 'Footwear',
    headline: 'Shoes for a mountain trip',
    prompt: CAREFUL,
    scenario:
      'You are planning for a mountain trip and for that you need shoes that are comfortable, stylish, and strong. Opt for lightweight pairs to ease long treks. Key features include waterproofing, ankle support, breathability, and sturdy grip. Since footwear is widely available and frequently purchased, you can easily compare options. Checking popular styles, discounts, and customer reviews can help you choose the right pair.',
    accent: 'butter',
    platforms: [
      PLATFORMS.F.flipkart,
      PLATFORMS.F.amazon,
      PLATFORMS.F.myntra,
      PLATFORMS.F.ajio,
      PLATFORMS.F.nykaafashion,
    ],
    videoSrc: '/ads/ad-3.mp4',
    adScript: {
      tagline: 'Made for the mountain.',
      beats: [
        'Waterproof upper.',
        'Ankle support on loose ground.',
        'Breathable. Sturdy grip.',
        'Lightweight for long treks.',
        'Compare styles and reviews.',
      ],
    },
  },
  {
    id: 'situation-4',
    code: 'Ad 4',
    number: 4,
    siteSlug: '4-search-situation-lf',
    siteLabel: 'Search Situation (l)F',
    involvement: 'low',
    categoryCode: 'F',
    category: 'Footwear',
    headline: 'Shoes before the trip',
    prompt: PLAIN,
    scenario:
      'You are heading for a mountain trip with your friends, and you realize you need a comfortable pair of shoes. Luckily, many footwear brands are running big sales right now, and some shoes are even endorsed by travel influencers! Since shoes are easily available and not too expensive, you can quickly check out the latest deals and grab a pair before your trip.',
    accent: 'blush',
    platforms: [
      PLATFORMS.F.flipkart,
      PLATFORMS.F.myntra,
      PLATFORMS.F.amazon,
      PLATFORMS.F.ajio,
      PLATFORMS.F.nykaafashion,
    ],
    videoSrc: '/ads/ad-4.mp4',
    adScript: {
      tagline: 'Grab a pair before you go.',
      beats: [
        'Big sales on right now.',
        'Loved by travel creators.',
        'Easy on the wallet.',
        'Sorted before the trip.',
      ],
    },
  },
  {
    id: 'situation-5',
    code: 'Ad 5',
    number: 5,
    siteSlug: '5-search-situation-hh',
    siteLabel: 'Search Situation (h)H',
    involvement: 'high',
    categoryCode: 'H',
    category: 'Online Course',
    headline: 'An online course for your career',
    prompt: CAREFUL,
    scenario:
      'Your semester break is coming, and you are thinking about joining an online course to learn new skills for your future career options. In today’s competitive job market, courses in areas like business, finance, data analytics, or digital marketing can give you an advantage. Before choosing, compare course content, certification value, teachers, flexibility, and career benefits to select the best option for your goals.',
    accent: 'sage',
    platforms: [
      PLATFORMS.H.coursera,
      PLATFORMS.H.edx,
      PLATFORMS.H.udemy,
      PLATFORMS.H.linkedinlearning,
      PLATFORMS.H.swayam,
    ],
    videoSrc: '/ads/ad-5.mp4',
    adScript: {
      tagline: 'Turn the break into an edge.',
      beats: [
        'Business. Finance. Analytics. Marketing.',
        'Compare course content.',
        'Check certification value.',
        'Learn from real faculty.',
        'Built around your schedule.',
      ],
    },
  },
  {
    id: 'situation-6',
    code: 'Ad 6',
    number: 6,
    siteSlug: '6-search-situation-lh',
    siteLabel: 'Search Situation (l)H',
    involvement: 'low',
    categoryCode: 'H',
    category: 'Online Course',
    headline: 'An online course over the break',
    prompt: PLAIN,
    scenario:
      'Your semester break is coming soon. Instead of wasting time, you can join an online course. Many students choose online courses to improve their skills and add certificates to their resumes. There are many platforms offering useful courses. You can study at your own speed. It is a good way to learn something helpful for future jobs.',
    accent: 'mint',
    platforms: [
      PLATFORMS.H.swayam,
      PLATFORMS.H.udemy,
      PLATFORMS.H.edx,
      PLATFORMS.H.coursera,
      PLATFORMS.H.linkedinlearning,
    ],
    videoSrc: '/ads/ad-6.mp4',
    adScript: {
      tagline: 'Don\'t waste the break.',
      beats: [
        'Join an online course.',
        'Add a certificate to your resume.',
        'Study at your own speed.',
        'Useful for future jobs.',
      ],
    },
  },
  {
    id: 'situation-7',
    code: 'Ad 7',
    number: 7,
    siteSlug: '7-search-situation-hd',
    siteLabel: 'Search Situation (h)D',
    involvement: 'high',
    categoryCode: 'D',
    category: 'Cold Drinks',
    headline: 'Something refreshing to drink',
    prompt: CAREFUL,
    scenario:
      'You and your friends are sitting in college on a hot summer day and start craving something refreshing. As more friends join, you all decide to order chilled drinks. You choose options like fresh juices or lemon-based drinks because they are hydrating, light on the stomach, and contain less sugar, helping you feel refreshed for longer compared to heavy, sugary beverages.',
    accent: 'sky',
    platforms: [
      PLATFORMS.D.blinkit,
      PLATFORMS.D.zomato,
      PLATFORMS.D.zepto,
      PLATFORMS.D.swiggyinstamart,
      PLATFORMS.D.bigbasket,
    ],
    videoSrc: '/ads/ad-7.mp4',
    adScript: {
      tagline: 'Refreshment that lasts.',
      beats: [
        'Fresh juices and lemon-based drinks.',
        'Hydrating and light on the stomach.',
        'Less sugar than fizzy drinks.',
        'Stay refreshed for longer.',
      ],
    },
  },
  {
    id: 'situation-8',
    code: 'Ad 8',
    number: 8,
    siteSlug: '8-search-situation-ld',
    siteLabel: 'Search Situation (l)D',
    involvement: 'low',
    categoryCode: 'D',
    category: 'Cold Drinks',
    headline: 'Something cool to drink',
    prompt: PLAIN,
    scenario:
      'You and your friends are sitting in college on a hot summer day and feel like having something cool. As more friends join, you all decide to order chilled drinks. You pick something simple and enjoyable, just to relax, chat, and refresh yourselves together.',
    accent: 'slate',
    platforms: [
      PLATFORMS.D.blinkit,
      PLATFORMS.D.zomato,
      PLATFORMS.D.zepto,
      PLATFORMS.D.swiggyinstamart,
      PLATFORMS.D.bigbasket,
    ],
    videoSrc: '/ads/ad-8.mp4',
    adScript: {
      tagline: 'Something cool, right now.',
      beats: [
        'Chilled drinks in minutes.',
        'Simple and enjoyable.',
        'Relax, chat, refresh.',
        'Better together.',
      ],
    },
  },
];

export const SITUATION_BY_ID = new Map(SITUATIONS.map((s) => [s.id, s]));

/** Seed query the search box opens with, per category. */
export const SEED_QUERY: Record<CategoryCode, string> = {
  L: 'best laptop under 80000',
  F: 'trekking shoes for mountain trip',
  H: 'online certification course',
  D: 'cold drinks delivery',
};

export const SOURCE_SITE =
  'https://sites.google.com/view/research-on-search/multiple-situations';
