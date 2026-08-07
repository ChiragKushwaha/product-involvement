import type { CategoryCode, ListingItem, SearchResult } from '@/types/survey';

/**
 * A fixed information environment for each product category.
 *
 * Every participant explores the same corpus, so SN/TE/CT/QD measures stay
 * comparable across sessions and the content cannot shift mid-study the way
 * live search results would.
 */

/* ----------------------------- L · Laptop ----------------------------- */

const LAPTOP_RESULTS: SearchResult[] = [
  {
    id: 'l-r1',
    title: 'Best Laptops Under ₹80,000 in India — Tested & Ranked',
    url: 'https://techspot-india.com/best-laptops-under-80000',
    domain: 'techspot-india.com',
    snippet:
      'We benchmarked 24 laptops between ₹40,000 and ₹80,000 on battery, thermals, display and build. Here is what actually holds up for student workloads.',
    body: [
      'Every laptop in this list was run through the same test suite: a four-hour mixed-use battery loop at 150 nits, a 30-minute sustained CPU load to check thermal throttling, and a colour-accuracy pass on the display.',
      'The short answer: in the ₹55,000–₹70,000 band you can reliably get 16 GB of RAM, a 14–15 inch panel and genuine all-day battery. Below ₹50,000 you will usually give up either RAM or screen quality.',
      'Battery life is where the spread is widest. The best performers cleared 9 hours in our loop; the worst managed 3 hours 40 minutes, which will not survive a full day of classes without a charger.',
      'On RAM: 8 GB is no longer enough if you keep a browser, a spreadsheet and a video call open at once. Several models in this range ship with 8 GB soldered and no upgrade path — check before buying, because that decision is permanent.',
      'Displays: a 14-inch 1920×1200 panel is the sweet spot for coursework. Anything at 1366×768 should be avoided at this budget, and several older listings still carry those panels at inflated prices.',
      'Build quality matters more than spec sheets suggest. Aluminium lids and reinforced hinges survive being carried in a backpack every day; the cheapest plastic chassis in this test showed flex after a few weeks.',
      'Microsoft Office: most retail units ship with a one-year Microsoft 365 Basic subscription rather than a perpetual Office licence. Read the box contents carefully — the difference is roughly ₹6,000 over three years.',
      'Warranty and service reach are worth more than a marginal spec bump. Brands with on-site service in tier-2 cities saved our readers an average of 11 days per repair compared with carry-in-only support.',
      'Our overall pick balances a 15.3-inch display, 16 GB upgradeable RAM, a 512 GB SSD and 8h 20m of measured battery at ₹67,990.',
    ],
  },
  {
    id: 'l-r2',
    title: 'How Much RAM Do Students Actually Need? 8GB vs 16GB',
    url: 'https://laptopmag-in.com/ram-guide-students',
    domain: 'laptopmag-in.com',
    snippet:
      'We measured real memory usage during typical student workloads — lectures, assignments, coding labs and video calls — to settle the 8GB vs 16GB question.',
    body: [
      'We logged memory usage on 40 student machines over a full semester. The median idle footprint of Windows 11 alone was 4.1 GB before any application launched.',
      'Add a browser with fifteen tabs (2.8 GB), a video call (1.1 GB) and a spreadsheet (0.6 GB) and an 8 GB machine is already swapping to disk. Swapping is what makes a laptop feel slow, more than processor speed does.',
      'On 16 GB machines running the same workload, we recorded zero sustained swap activity and consistently faster application switching.',
      'For project work involving virtual machines, large datasets or design software, 16 GB is the practical floor and 32 GB is worth considering.',
      'Crucially, many thin laptops solder RAM to the board. If the specification says "onboard" or "soldered", the amount you buy is the amount you keep for the life of the machine.',
      'Our recommendation for a four-year degree: buy 16 GB now rather than planning to upgrade later, unless the model explicitly documents an accessible SODIMM slot.',
      'Storage interacts with this. A fast NVMe SSD softens the penalty of running low on memory, but it does not eliminate it — and it wears faster under heavy swap.',
    ],
  },
  {
    id: 'l-r3',
    title: 'Laptop Battery Life Rankings 2025 — Measured, Not Claimed',
    url: 'https://batterybench.org/laptop-rankings',
    domain: 'batterybench.org',
    snippet:
      'Manufacturer battery claims average 41% higher than measured runtime. Our independent test results for 60 current models.',
    body: [
      'Manufacturers quote battery life from video-playback loops at low brightness. Real mixed use — browser, documents, a call — is far more demanding.',
      'Across 60 models we found an average gap of 41% between the claimed figure and our measured mixed-use runtime. One model claimed 12 hours and delivered 5 hours 10 minutes.',
      'The strongest performers share three traits: an efficient low-power processor, a 1200p rather than 4K panel, and a battery above 60 Wh.',
      'A 4K or OLED display typically costs 20–30% of runtime. For coursework, a good 1200p IPS panel is the better trade.',
      'Charging speed partly compensates. Models supporting 65 W USB-C charging reached 50% in about 35 minutes, which covers a gap between lectures.',
      'Battery health declines roughly 15–20% over three years of daily charging. A laptop that starts at 4 hours will not last a full semester day by year three.',
      'If you need genuine all-day use away from a socket, target a measured figure of at least 7 hours, which in practice means shortlisting on tested numbers rather than box claims.',
    ],
  },
  {
    id: 'l-r4',
    title: 'Reddit — Which laptop for college under 70k? (r/IndianGaming)',
    url: 'https://forum-threads.net/r/laptops/college-under-70k',
    domain: 'forum-threads.net',
    snippet:
      '340 comments. Students share what they actually bought, what broke, and what they wish they had checked before ordering.',
    body: [
      'Top comment (412 upvotes): "Bought at 45k to save money in first year. Regretted it by third semester — 8 GB soldered, could not run anything alongside my IDE. Spend the extra 15k."',
      'Second comment (287 upvotes): "Check service centre locations in your city before you check specs. My brand has no centre in my town and every repair meant couriering the machine for two weeks."',
      'A recurring theme: buyers underestimate weight. Several posters said a 2.3 kg machine that seemed fine in the shop became a genuine burden carried daily across campus.',
      '"The Office thing catches everyone out," one poster wrote. "Mine came with a one-year trial, not the full licence. Budget for that."',
      'Multiple posters recommended buying during festival sale windows, reporting price drops of ₹6,000–₹12,000 on the same SKU compared with list price.',
      'A dissenting view with 96 upvotes argued that the mid-range is oversold and that a refurbished business laptop offers better build and keyboard quality for the money — with the caveat of a shorter warranty.',
      'Consensus in the thread: 16 GB RAM, 512 GB SSD, sub-1.7 kg, and buy from a seller with an easy return window in case of a dead pixel or coil whine.',
    ],
  },
  {
    id: 'l-r5',
    title: 'Student Laptop Buying Guide — Warranty, Service & Hidden Costs',
    url: 'https://consumeradvice-in.org/student-laptop-guide',
    domain: 'consumeradvice-in.org',
    snippet:
      'The sticker price is not the total cost. Extended warranty, accidental damage cover, software licences and service reach explained.',
    body: [
      'A laptop bought for study is typically kept for four years. Total cost over that period routinely exceeds the sticker price by 18–25%.',
      'Standard warranty is one year. Extending to three years costs ₹4,000–₹7,000 and is generally worth it for machines carried daily, where the most common failures are hinge and port damage.',
      'Accidental damage protection is separate from warranty and covers spills and drops — the two most frequent student claims. It typically costs ₹3,000–₹5,000 for three years.',
      'Software: budget for Microsoft 365 unless your institution provides it free. Many universities do, so check before paying.',
      'Beware "no-cost EMI" offers that quietly remove an existing discount. Compare the total amount payable, not the monthly figure.',
      'On-site versus carry-in service is the single most underrated specification. On-site support means an engineer visits; carry-in means you lose the machine for days during term.',
      'Finally, check the return window. Fourteen days lets you test the display for backlight bleed and the keyboard for dead keys under real use.',
    ],
  },
  {
    id: 'l-r6',
    title: 'Croma vs Reliance Digital vs Online — Where to Buy',
    url: 'https://pricecompare-in.com/laptop-retailers',
    domain: 'pricecompare-in.com',
    snippet:
      'Price, return policy, demo units and after-sales differences between offline chains and online marketplaces.',
    body: [
      'Online marketplaces are usually ₹2,000–₹5,000 cheaper on identical SKUs, and run deeper discounts during sale events.',
      'Offline chains let you type on the keyboard and judge the display before committing — worth a premium if you are unsure between two shortlisted models.',
      'Return policies differ sharply. Marketplace returns are typically 7–10 days and sometimes replacement-only for laptops; store returns are often 7 days with a restocking condition.',
      'Exchange offers on an old laptop are generally more generous online, but the quoted value drops after physical inspection more often than not.',
      'For warranty, the manufacturer honours it regardless of where you bought, provided you keep the invoice. Retailer-specific extended plans do not transfer.',
      'Our advice: shortlist online on measured reviews, then handle the top two in a store if there is one nearby, then buy wherever the total price after exchange and card offers is lowest.',
    ],
  },
];

const LAPTOP_LISTINGS: ListingItem[] = [
  {
    id: 'l-p1',
    name: 'Vantage Book 14 — Core i5 13th Gen',
    price: '₹58,990',
    meta: '14" WUXGA · 16 GB · 512 GB SSD',
    rating: 4.3,
    ratingCount: '2,847',
    highlights: ['16 GB DDR5 (upgradeable)', '8h 20m measured battery', '1.4 kg', 'MS 365 Basic 1 yr'],
    detail: [
      '14-inch 1920×1200 IPS display, 300 nits, anti-glare finish.',
      '13th generation Core i5 with 10 cores; sustained load stabilises at 28 W without thermal throttling.',
      '16 GB DDR5 in one soldered module plus one free SODIMM slot, expandable to 32 GB.',
      '512 GB NVMe SSD with a second M.2 slot free for later expansion.',
      'Measured 8 hours 20 minutes of mixed use at 150 nits. 65 W USB-C charging reaches 50% in 34 minutes.',
      'Ports: 2× USB-C, 2× USB-A, HDMI 2.1, 3.5 mm combo. No SD reader.',
      'One-year on-site warranty; three-year extension available at ₹5,499. Ships with Microsoft 365 Basic for 12 months.',
      'Backlit keyboard with 1.5 mm travel; fingerprint reader in the power button.',
    ],
  },
  {
    id: 'l-p2',
    name: 'Nimbus Slim 15 — Ryzen 7',
    price: '₹67,490',
    meta: '15.3" · 16 GB · 1 TB SSD',
    rating: 4.5,
    ratingCount: '1,932',
    highlights: ['1 TB storage', '9h 05m measured battery', 'Aluminium chassis', 'On-site warranty'],
    detail: [
      '15.3-inch 2560×1600 IPS panel at 400 nits — noticeably brighter than the category average.',
      'Ryzen 7 eight-core processor; the strongest sustained multi-core result in this price band in our testing.',
      '16 GB LPDDR5 soldered. Note: no upgrade path, so this is the final memory configuration.',
      '1 TB NVMe SSD, replaceable.',
      'Measured 9 hours 5 minutes mixed use — the best result of any laptop we tested under ₹70,000.',
      'Full aluminium lid and deck; no measurable flex under normal handling.',
      'One-year on-site warranty included. Microsoft 365 Basic for 12 months bundled.',
      'Weighs 1.6 kg. Charger is a compact 65 W USB-C brick that also charges phones.',
    ],
  },
  {
    id: 'l-p3',
    name: 'CoreEdge 14 — Core i3 12th Gen',
    price: '₹41,999',
    meta: '14" FHD · 8 GB · 512 GB SSD',
    rating: 3.9,
    ratingCount: '5,104',
    highlights: ['Lowest price in range', '8 GB soldered', '5h 15m battery', 'Carry-in warranty'],
    detail: [
      '14-inch 1920×1080 IPS display at 250 nits — usable indoors, dim near a window.',
      '12th generation Core i3; adequate for documents, browsing and video calls, slower under multitasking.',
      '8 GB LPDDR4X soldered with no upgrade slot. This is the main limitation of the machine.',
      '512 GB NVMe SSD.',
      'Measured 5 hours 15 minutes of mixed use — enough for most of a college day but not all of it.',
      'Plastic chassis with visible lid flex. Weighs 1.5 kg.',
      'One-year carry-in warranty; no on-site option offered.',
      'Ships with Windows 11 Home and a one-month Microsoft 365 trial only.',
    ],
  },
  {
    id: 'l-p4',
    name: 'Vantage Pro 15 — Core i7 · 32 GB',
    price: '₹79,990',
    meta: '15.6" · 32 GB · 1 TB SSD',
    rating: 4.6,
    ratingCount: '864',
    highlights: ['32 GB RAM', 'Top of budget range', '7h 40m battery', '3-yr warranty included'],
    detail: [
      '15.6-inch 2880×1800 OLED panel. Excellent contrast; costs about 25% of battery runtime versus an IPS equivalent.',
      'Core i7 fourteen-core processor with a 45 W sustained power limit and a dual-fan cooling system.',
      '32 GB DDR5 across two SODIMM slots, both accessible and upgradeable to 64 GB.',
      '1 TB NVMe SSD with a free second slot.',
      'Measured 7 hours 40 minutes mixed use despite the OLED panel, helped by a 75 Wh battery.',
      'Three-year on-site warranty included in the price — unusual at this level and worth roughly ₹6,000.',
      'Weighs 1.8 kg, the heaviest of our shortlist. The charger is a 100 W brick.',
      'Comfortably exceeds every requirement in the ₹40,000–₹80,000 brief, at the very top of the budget.',
    ],
  },
];

/* ---------------------------- F · Footwear ---------------------------- */

const FOOTWEAR_RESULTS: SearchResult[] = [
  {
    id: 'f-r1',
    title: 'Best Trekking Shoes for Beginners — Tested on Real Trails',
    url: 'https://trailgear-review.com/best-trekking-shoes',
    domain: 'trailgear-review.com',
    snippet:
      'We walked 200 km in 14 pairs across wet rock, loose scree and mud to test grip, waterproofing and ankle support.',
    body: [
      'Grip is the specification that matters most and is quoted least. We tested each pair on wet limestone, loose gravel and packed mud at a 20-degree incline.',
      'Rubber compound beats tread pattern. Softer compounds gripped wet rock dramatically better but wore roughly 40% faster on tarmac.',
      'Waterproofing: a membrane keeps water out but also keeps sweat in. On warm-weather treks, several testers preferred a breathable non-waterproof shoe with fast-drying mesh.',
      'Ankle support is a genuine trade-off, not a straight upgrade. Mid-cut shoes reduced ankle roll on uneven ground but restricted movement and added weight.',
      'Weight compounds over distance. An extra 200 g per shoe was clearly noticeable after 15 km; every tester ranked lighter pairs higher by the end of a long day.',
      'Break-in period ranged from zero to three weeks. Never take a new pair straight onto a multi-day trek — blisters ended two of our test walks early.',
      'Sizing runs about half a size small across the category, and feet swell on long descents. Most testers ended up half a size up from their street shoe.',
      'Our overall pick weighed 340 g per shoe, used a soft grip compound, had a breathable upper and needed no break-in.',
    ],
  },
  {
    id: 'f-r2',
    title: 'Waterproof vs Breathable Hiking Shoes — Which for Your Trip?',
    url: 'https://outdoorindia.net/waterproof-vs-breathable',
    domain: 'outdoorindia.net',
    snippet:
      'Membranes are not automatically better. A guide to choosing based on season, terrain and trip length.',
    body: [
      'A waterproof membrane is a laminated layer that blocks liquid water while allowing some vapour through. In practice, "some" is the operative word.',
      'In cool, wet conditions a membrane is clearly worth it — dry feet stay warmer and blister less.',
      'In warm conditions the same membrane traps sweat. Testers reported wetter feet inside waterproof shoes than in mesh shoes on hot-weather walks.',
      'Non-waterproof mesh shoes get wet quickly but also dry quickly — often within an hour of walking. Membrane shoes, once flooded over the collar, stay wet for a day or more.',
      'For stream crossings, neither option keeps water out once it comes over the top. Drainage and drying speed matter more than the membrane.',
      'Durability: membranes degrade with dirt and flexing. Expect meaningfully reduced waterproofing after roughly 500 km unless cleaned regularly.',
      'Recommendation: for a single warm-weather mountain trip, prioritise breathability, grip and low weight. Choose a membrane if you expect sustained rain or cold.',
    ],
  },
  {
    id: 'f-r3',
    title: 'Shoe Sizing for Treks — Why You Should Size Up',
    url: 'https://footfit-guide.com/trek-sizing',
    domain: 'footfit-guide.com',
    snippet:
      'Feet swell up to a full size on long descents. How to measure and fit correctly, and the sock rule most people miss.',
    body: [
      'Feet swell during sustained walking — typically half to a full size over a full day, more in heat.',
      'The consequence is bruised and lost toenails on descents, where the foot slides forward into the toe box. This is the single most common trekking foot injury.',
      'Fit test: with the shoe unlaced, slide your foot fully forward until your toes touch the front. You should fit one finger behind your heel.',
      'Measure your feet in the evening, when they are already slightly swollen. Morning measurements run small.',
      'Always fit with the socks you will actually wear. A thick trekking sock can consume most of a half size.',
      'Feet are usually different sizes. Fit the larger one and adjust the other with lacing.',
      'Heel lock lacing — using the top eyelets to form a loop — stops heel lift without over-tightening the whole shoe. It is the most useful adjustment most walkers never learn.',
      'If ordering online, choose a seller with free returns and test the fit indoors on carpet before wearing them outside.',
    ],
  },
  {
    id: 'f-r4',
    title: 'Trekking Shoes Under ₹4,000 — Are the Sale Deals Worth It?',
    url: 'https://budgetgear-in.com/trekking-under-4000',
    domain: 'budgetgear-in.com',
    snippet:
      'Discount-season trekking shoes tested against premium pairs. Where the savings are real and where they are not.',
    body: [
      'We bought eight sale-priced pairs between ₹1,800 and ₹4,000 and tested them against a ₹9,000 benchmark.',
      'Two budget pairs matched the benchmark on grip. The rubber compound is not always where manufacturers economise.',
      'Where budget pairs consistently fell short was midsole durability. Cushioning compressed noticeably after 80–120 km, against 400 km-plus for the benchmark.',
      'For a single trip or occasional weekend walking, a well-chosen budget pair is genuinely sufficient. For regular trekking, cost per kilometre favours the more expensive shoe.',
      'Influencer-endorsed models in our test showed no performance advantage; the endorsement premium averaged ₹700 with no measurable difference in grip, weight or durability.',
      'Watch inflated "original" prices during sale events. Several models showed a listed discount of 60% from a price the shoe had never actually sold at.',
      'Best value in the test was a ₹2,900 pair with a soft grip compound, a breathable mesh upper and adequate cushioning for roughly 150 km.',
    ],
  },
  {
    id: 'f-r5',
    title: 'Customer Reviews — What Buyers Say After 6 Months',
    url: 'https://reviewaggregate-in.com/trekking-shoes-longterm',
    domain: 'reviewaggregate-in.com',
    snippet:
      'Aggregated from 12,000 verified purchase reviews: the complaints that only appear after months of use.',
    body: [
      'We analysed 12,000 verified reviews, separating those written within a week of delivery from those written after three months or more.',
      'Early reviews are dominated by fit and appearance. Late reviews are dominated by sole separation, lost cushioning and worn tread.',
      'Sole separation was the most frequent long-term complaint at 23% of late reviews, concentrated in a handful of models.',
      'Average rating fell from 4.4 in early reviews to 3.8 in reviews after three months — a consistent pattern across brands.',
      'Waterproofing complaints rose sharply after month four, matching the expected degradation of untreated membranes.',
      'The models that held their rating over time shared stitched rather than purely glued soles.',
      'Practical advice: filter reviews by most recent rather than most helpful, since the helpful ones are usually the oldest.',
    ],
  },
];

const FOOTWEAR_LISTINGS: ListingItem[] = [
  {
    id: 'f-p1',
    name: 'Ridgeline Trek Mid — Waterproof',
    price: '₹4,299',
    meta: 'Mid-cut · Membrane · 420 g',
    rating: 4.2,
    ratingCount: '3,218',
    highlights: ['Waterproof membrane', 'Ankle support', 'Soft grip compound', '2-week break-in'],
    detail: [
      'Mid-cut collar providing genuine ankle support on uneven ground.',
      'Waterproof membrane; kept feet dry through 30 minutes of simulated rain in testing.',
      'Soft rubber compound with 5 mm lugs — strong grip on wet rock, wears faster on tarmac.',
      '420 g per shoe in UK 8, at the heavier end of the category.',
      'Requires roughly two weeks of break-in. Not suitable for wearing straight onto a trek.',
      'Runs half a size small. Order one size up from your street shoe.',
      'Stitched-and-glued sole construction, which correlates with lower long-term separation rates.',
      'Breathability is the trade-off — testers reported warm feet above about 25°C.',
    ],
  },
  {
    id: 'f-p2',
    name: 'Skyfell Lite Trail — Breathable',
    price: '₹2,899',
    meta: 'Low-cut · Mesh · 310 g',
    rating: 4.4,
    ratingCount: '7,640',
    highlights: ['Lightest in test', 'No break-in needed', 'Dries in ~1 hour', 'Currently 45% off'],
    detail: [
      'Low-cut breathable mesh upper; no membrane, so it wets through but dries within about an hour of walking.',
      'Lightest pair in our comparison at 310 g per shoe — clearly noticeable over long distances.',
      'Soft grip compound matching pairs at three times the price on wet rock.',
      'No break-in period; comfortable from first wear according to the large majority of reviews.',
      'Midsole cushioning holds up for roughly 150 km before noticeable compression.',
      'Low-cut design gives no ankle support — a real consideration on loose or rocky descents.',
      'Currently discounted from ₹5,299. Verify the original price, which has fluctuated.',
      'True to size for most wearers; still allow room for swelling on long descents.',
    ],
  },
  {
    id: 'f-p3',
    name: 'Summit Guide Pro',
    price: '₹8,999',
    meta: 'Mid-cut · Membrane · 460 g',
    rating: 4.7,
    ratingCount: '1,105',
    highlights: ['400 km+ midsole', 'Stitched sole', 'Best long-term rating', 'Heaviest'],
    detail: [
      'The benchmark pair in our durability testing: midsole cushioning held past 400 km.',
      'Fully stitched sole construction — no separation reported in long-term review data.',
      'Waterproof membrane with a more breathable laminate than budget equivalents, though still warm in heat.',
      'Mid-cut with a reinforced heel counter; the most secure ankle support in the test.',
      '460 g per shoe, the heaviest option. The weight is noticeable after about 15 km.',
      'Rating held at 4.7 in reviews written after three months, against a category average drop to 3.8.',
      'Break-in of about one week.',
      'Three-year construction warranty against sole separation.',
    ],
  },
  {
    id: 'f-p4',
    name: 'Cascade Flex Trail — Influencer Edition',
    price: '₹3,499',
    meta: 'Low-cut · Mesh · 350 g',
    rating: 4.0,
    ratingCount: '9,882',
    highlights: ['Trending style', 'Six colourways', '120 km midsole', 'Endorsement premium'],
    detail: [
      'Heavily promoted by travel creators; the most-viewed trekking shoe on social platforms this season.',
      'Breathable mesh upper, no membrane. Dries quickly.',
      'Grip is adequate on dry trail but tested below average on wet rock.',
      'Midsole compresses noticeably after roughly 120 km — suitable for occasional use rather than regular trekking.',
      '350 g per shoe. Six colourways, the widest style range in this comparison.',
      'Our testing found no performance advantage over cheaper pairs; the endorsement premium is roughly ₹700.',
      'Reviews skew positive on appearance and negative on durability after three months.',
      'Runs true to size.',
    ],
  },
];

/* -------------------------- H · Online Course -------------------------- */

const COURSE_RESULTS: SearchResult[] = [
  {
    id: 'h-r1',
    title: 'Which Online Certificates Do Employers Actually Value?',
    url: 'https://careerinsight-in.com/certificate-value',
    domain: 'careerinsight-in.com',
    snippet:
      'We surveyed 400 hiring managers on how they weigh online certificates in data analytics, finance, business and digital marketing.',
    body: [
      'We asked 400 hiring managers across technology, finance and marketing how much weight they give an online certificate on a fresher CV.',
      'The headline: 62% said a certificate alone changes nothing, but 78% said a certificate accompanied by a portfolio project materially improves a candidate.',
      'Recognition varies sharply by issuer. University-affiliated and industry-issued certificates were recognised by over 70% of respondents; generic marketplace certificates by 24%.',
      'In data analytics, demonstrable SQL and spreadsheet skill outweighed any certificate. Managers asked for a work sample in 81% of cases.',
      'In digital marketing, platform-specific credentials from advertising providers carried the most weight, largely because they are tied to tools the employer already uses.',
      'In finance, structured multi-month programmes were valued over short courses, which respondents associated with surface-level coverage.',
      'Completion rate matters more than enrolment. Several managers said they check whether the candidate finished a graded, proctored assessment or merely watched videos.',
      'The strongest signal reported was a capstone project the candidate could talk through in detail during an interview.',
    ],
  },
  {
    id: 'h-r2',
    title: 'Coursera vs edX vs Udemy vs SWAYAM — Honest Comparison',
    url: 'https://edtech-compare.org/platform-comparison',
    domain: 'edtech-compare.org',
    snippet:
      'Course quality, assessment rigour, certificate recognition, cost and flexibility compared across the major platforms.',
    body: [
      'These platforms differ more in model than in catalogue. Understanding the model tells you what the certificate is worth.',
      'University-partnered platforms host courses authored by institutions, with graded assignments and fixed or semi-fixed schedules. Certificates carry the institution\'s name, which drives recognition.',
      'Open marketplaces let any instructor publish. Quality ranges from excellent to poor within the same catalogue, so the instructor matters more than the platform.',
      'Government-backed Indian platforms such as SWAYAM offer courses from national institutions, often free, with paid proctored examinations and in some cases formal credit transfer.',
      'Professional-network platforms integrate the credential directly into a profile recruiters already view, which is their main advantage.',
      'Assessment rigour is the clearest differentiator. Peer-graded and proctored assessments signal more than an auto-marked quiz.',
      'Cost ranges from free audit access to multi-thousand-rupee specialisations. Marketplace list prices are routinely discounted by 80–90%, so never pay list price.',
      'Flexibility: marketplace courses are fully self-paced with lifetime access; university courses often run in cohorts with deadlines, which improves completion rates.',
      'Practical approach: choose the instructor and syllabus first, then check the assessment format, then compare price.',
    ],
  },
  {
    id: 'h-r3',
    title: 'Data Analytics vs Digital Marketing — Which to Learn First?',
    url: 'https://skillpath-guide.com/analytics-vs-marketing',
    domain: 'skillpath-guide.com',
    snippet:
      'Entry requirements, time to job-readiness, salary ranges and overlap between the two most popular course tracks.',
    body: [
      'Both fields hire freshers, but they reward different aptitudes and take different amounts of time to become employable.',
      'Data analytics requires comfort with numbers and logical structure. The core stack is spreadsheets, SQL, and one visualisation tool, with statistics underneath.',
      'Time to job-readiness for analytics is typically four to six months of consistent study including projects.',
      'Digital marketing requires comfort with writing, design sensibility and analytical follow-through. The core stack is search advertising, social platforms, analytics and basic content skills.',
      'Time to job-readiness for marketing is shorter — often two to four months — partly because platform certifications are free and directly tied to tools employers use.',
      'The two overlap in measurement. Marketing roles increasingly expect analytics skill, and analysts frequently work on marketing data.',
      'Entry salaries in analytics tend to start higher; marketing roles have a wider spread and reward demonstrable campaign results.',
      'If you are undecided, start with a short free course in each and see which one you actually return to in week three.',
    ],
  },
  {
    id: 'h-r4',
    title: 'Free vs Paid Certificates — What Changes',
    url: 'https://learnersreview-in.org/free-vs-paid',
    domain: 'learnersreview-in.org',
    snippet:
      'Auditing is often free; the certificate is what costs money. What you gain and lose in each mode.',
    body: [
      'Most university-partnered courses let you access lectures free in audit mode. What payment unlocks is graded assignments and the certificate.',
      'If your goal is the skill, auditing is frequently sufficient — you get the same lectures and readings.',
      'If your goal is a CV line, you need the paid track, because the certificate is issued only on graded completion.',
      'Financial aid is available on several platforms and is approved more often than learners expect. Applications typically take two weeks.',
      'Indian government platforms offer many courses free including assessment, with a modest examination fee — the best cost-to-recognition ratio available for many subjects.',
      'Marketplace courses are almost always on discount. Paying list price is unnecessary; wait for the routine promotional pricing.',
      'Subscription models make sense only if you will genuinely complete several courses; median usage data suggests most subscribers complete one.',
      'A middle path many learners take: audit free to confirm the course suits you, then pay for the certificate track only if you intend to finish.',
    ],
  },
  {
    id: 'h-r5',
    title: 'Why 87% of Online Course Enrolments Never Finish',
    url: 'https://studyhabits-research.org/completion-rates',
    domain: 'studyhabits-research.org',
    snippet:
      'Completion data across platforms and the study patterns that separate finishers from the majority who stop.',
    body: [
      'Across large open online courses, median completion sits between 5% and 15%. Paid cohort-based courses do considerably better.',
      'The strongest predictor of completion is a fixed weekly schedule. Learners who blocked specific hours finished at roughly four times the rate of those who studied when convenient.',
      'The second predictor is course length. Courses under six weeks finished far more often than multi-month specialisations.',
      'Deadlines help. Cohort courses with graded due dates outperformed fully self-paced equivalents on completion, despite being less flexible.',
      'Paying increases completion, but only modestly — the effect is smaller than a fixed schedule.',
      'Most drop-off happens in weeks two and three, once novelty fades and before momentum builds.',
      'Practical advice: start with one short course rather than an ambitious specialisation, schedule fixed hours, and finish something before enrolling in anything else.',
    ],
  },
];

const COURSE_LISTINGS: ListingItem[] = [
  {
    id: 'h-p1',
    name: 'Data Analytics Professional Certificate',
    price: '₹3,999 / month',
    meta: '6 months · Beginner · Graded',
    rating: 4.6,
    ratingCount: '184,320',
    highlights: ['Industry-issued', 'Capstone project', 'Free audit available', 'Financial aid'],
    detail: [
      'Eight courses covering spreadsheets, SQL, visualisation and statistics, ending in a capstone project.',
      'Roughly six months at ten hours per week; fully self-paced with suggested deadlines.',
      'Issued by an industry provider — recognised by over 70% of hiring managers in our reference survey.',
      'Graded assignments and a portfolio capstone, which is the element employers ask about in interviews.',
      'Lectures can be audited free; payment unlocks grading and the certificate.',
      'Financial aid available, typically decided within two weeks.',
      'No prerequisites. Comfort with numbers is assumed but no prior coding is required.',
      'Median reported completion time is longer than advertised — most learners take eight to nine months.',
    ],
  },
  {
    id: 'h-p2',
    name: 'Digital Marketing Fundamentals',
    price: '₹499',
    meta: '18 hours · Beginner · Self-paced',
    rating: 4.4,
    ratingCount: '92,140',
    highlights: ['Lifetime access', '87% off list price', 'No deadlines', 'Auto-graded quizzes'],
    detail: [
      'Eighteen hours of video covering search advertising, social platforms, email and analytics basics.',
      'Fully self-paced with lifetime access and no deadlines.',
      'Listed at ₹3,999 and routinely discounted to ₹499 — list price is effectively nominal.',
      'Assessment is auto-marked quizzes only; there is no proctored examination or peer-reviewed project.',
      'Marketplace-issued certificate, recognised by around 24% of hiring managers in our reference survey.',
      'Instructor reviews are strong; the platform catalogue varies widely so the instructor matters more than the brand.',
      'Good coverage of tools; light on strategy and measurement depth.',
      'Best used as an orientation before a platform-specific advertising credential.',
    ],
  },
  {
    id: 'h-p3',
    name: 'Financial Markets — University Course',
    price: 'Free to audit · ₹4,200 certificate',
    meta: '7 weeks · Intermediate · Cohort',
    rating: 4.8,
    ratingCount: '41,807',
    highlights: ['University-issued', 'Weekly deadlines', 'Peer-graded', 'High completion rate'],
    detail: [
      'Seven-week university course on risk, behavioural finance, and the structure of financial markets.',
      'Runs in cohorts with weekly deadlines — less flexible, but associated with much higher completion rates.',
      'Peer-graded written assignments alongside auto-marked quizzes.',
      'Certificate carries the university name, which drives the high recognition seen for institution-issued credentials.',
      'Free to audit all lectures and readings; the certificate track costs ₹4,200.',
      'Assumes basic familiarity with economics; genuine beginners report finding weeks three and four demanding.',
      'Highest rated course on this shortlist at 4.8 across 41,807 ratings.',
      'Approximately six hours per week of study.',
    ],
  },
  {
    id: 'h-p4',
    name: 'Business Analytics — National Programme',
    price: 'Free · ₹1,000 exam fee',
    meta: '12 weeks · Beginner · Credit transfer',
    rating: 4.5,
    ratingCount: '23,918',
    highlights: ['Free content', 'Proctored exam', 'Credit transfer eligible', 'IIT/IIM faculty'],
    detail: [
      'Twelve-week course from national institute faculty, delivered free including all assignments.',
      'Certification requires a proctored in-person examination with a fee of approximately ₹1,000.',
      'Eligible for academic credit transfer at participating institutions — unique among the options here.',
      'Proctored assessment is a stronger completion signal than auto-marked quizzes.',
      'Weekly assignments with deadlines; the course runs on a fixed semester calendar rather than on demand.',
      'Content is academically oriented and heavier on theory than marketplace equivalents.',
      'Best cost-to-recognition ratio on this shortlist, with the trade-off of a fixed schedule and an in-person exam.',
      'Enrolment windows open twice a year.',
    ],
  },
];

/* --------------------------- D · Cold Drinks --------------------------- */

const DRINKS_RESULTS: SearchResult[] = [
  {
    id: 'd-r1',
    title: 'Best Summer Drinks to Beat the Heat — Nutritionist Ranked',
    url: 'https://healthline-in.com/summer-drinks-ranked',
    domain: 'healthline-in.com',
    snippet:
      'Fresh juice, lemon water, coconut water, iced tea and soft drinks compared on hydration, sugar and how long they keep you refreshed.',
    body: [
      'Not all cold drinks hydrate equally. Sugar concentration is the main variable — high-sugar drinks slow fluid absorption.',
      'Coconut water ranked first for hydration, with natural electrolytes and roughly 6 g of sugar per 100 ml.',
      'Fresh lime water with a pinch of salt ranked second and is the cheapest effective option, at almost no sugar if unsweetened.',
      'Fresh fruit juice sits mid-table: real nutrients, but 8–12 g of sugar per 100 ml and no fibre once juiced.',
      'Iced tea, unsweetened, performed well. Sweetened bottled versions carry as much sugar as soft drinks.',
      'Carbonated soft drinks ranked last: 10–11 g of sugar per 100 ml, which produces a brief lift followed by a slump.',
      'On the "how long do you stay refreshed" question, low-sugar drinks kept testers comfortable roughly twice as long in hot conditions.',
      'Practical note: cold drinks feel more refreshing than they hydrate. Temperature affects perception, sugar content affects the outcome.',
    ],
  },
  {
    id: 'd-r2',
    title: 'Packaged Juice vs Fresh Juice — Reading the Label',
    url: 'https://foodlabel-in.org/juice-comparison',
    domain: 'foodlabel-in.org',
    snippet:
      'What "100% juice", "nectar" and "juice drink" actually mean, and the sugar content behind each claim.',
    body: [
      'Labelling terms are regulated and specific. "100% juice" means no added sugar and no water. "Nectar" typically means 25–50% juice with added sugar and water. "Juice drink" can be under 10% juice.',
      'Sugar per 100 ml: 100% orange juice around 9 g, nectar around 11 g, juice drink around 10 g. All three are close, though only one comes entirely from fruit.',
      'Reconstituted "from concentrate" juice is nutritionally similar to fresh but loses some aromatic compounds and vitamin C during processing.',
      'Fresh-pressed juice has the highest vitamin content but a shelf life measured in hours, which is why it is rarely sold packaged.',
      'Pulp matters. Juice with pulp retains some fibre, which slows sugar absorption slightly.',
      'Preservative-free chilled juices in the refrigerated aisle are closer to fresh than shelf-stable cartons, and cost roughly 40% more.',
      'Reading tip: ignore the front of the pack and read the ingredients list. If sugar appears in the first three ingredients, it is a sweetened drink.',
    ],
  },
  {
    id: 'd-r3',
    title: 'Quick Delivery Apps Compared — Speed, Price & Range',
    url: 'https://appcompare-in.com/quick-commerce',
    domain: 'appcompare-in.com',
    snippet:
      'We ordered the same basket across five quick-commerce apps and compared delivery time, total cost and stock reliability.',
    body: [
      'We placed identical orders — six chilled drinks — across five apps at three times of day, in two cities.',
      'Delivery times ranged from 8 to 34 minutes. The fastest apps operate dark stores within a two-kilometre radius.',
      'Item prices were within 6% of each other. The real cost difference was fees: delivery, handling and surge charges added ₹18–₹64 to the same basket.',
      'Small-order fees applied below ₹99–₹199 depending on the app, which materially changes the cheapest option for a small order.',
      'Stock reliability differed most. Fresh juice and coconut water were out of stock in 31% of afternoon orders on the two fastest apps.',
      'Restaurant-delivery apps carried a wider fresh-drink range but took two to three times longer and cost more.',
      'Grocery-focused apps had the deepest packaged range and the best prices on multi-packs, with slower slots.',
      'Practical conclusion: for immediate chilled drinks the fastest app usually wins on time; for a group order of six or more, the grocery apps are meaningfully cheaper per unit.',
    ],
  },
  {
    id: 'd-r4',
    title: 'Sugar Content in Popular Cold Drinks — Full Chart',
    url: 'https://nutridata-in.org/cold-drink-sugar',
    domain: 'nutridata-in.org',
    snippet:
      'Grams of sugar per serving across 40 commonly ordered cold drinks, from soda to fresh lime water.',
    body: [
      'All figures are per 250 ml serving, taken from published nutrition panels.',
      'Cola: 26.5 g. Lemon-lime soda: 25 g. Both exceed the WHO daily added-sugar guideline in a single serving.',
      'Packaged mango drink: 28 g — the highest in the survey, higher than cola.',
      'Packaged 100% orange juice: 22 g, entirely from fruit rather than added.',
      'Sweetened bottled iced tea: 18 g. Unsweetened iced tea: under 1 g.',
      'Coconut water: 15 g, accompanied by potassium and other electrolytes.',
      'Fresh lime water, unsweetened: under 1 g. With two teaspoons of sugar: 8 g.',
      'Sparkling water and plain chilled water: 0 g.',
      'The practical takeaway is that "fruit" on the label predicts very little; the panel is the only reliable guide.',
    ],
  },
  {
    id: 'd-r5',
    title: 'Group Orders — How to Split a Cold Drink Order for 5+',
    url: 'https://collegelife-in.com/group-order-tips',
    domain: 'collegelife-in.com',
    snippet:
      'Multi-pack pricing, combo deals and the fee thresholds that make group ordering much cheaper per person.',
    body: [
      'Ordering as a group changes the economics substantially, mostly through fee thresholds rather than item discounts.',
      'Most apps waive delivery fees above a basket value of ₹199–₹299, so a group order usually clears the threshold that a single drink does not.',
      'Multi-packs of four or six typically cost 15–22% less per unit than singles.',
      'Combo deals bundling drinks with snacks are usually genuine savings when the group wanted the snacks anyway, and a false economy otherwise.',
      'Fresh juices are rarely available in multi-packs and are priced per unit, so a mixed order of packaged multi-packs plus a few fresh items is often the cheapest structure.',
      'One order beats several separate orders: five individual orders paid five sets of fees in our test, costing 41% more than the same items in one basket.',
      'Check whether the app applies a surge charge at peak times — afternoon peaks added ₹20–₹35 in our comparison.',
    ],
  },
];

const DRINKS_LISTINGS: ListingItem[] = [
  {
    id: 'd-p1',
    name: 'Fresh Lime Water — 300 ml (pack of 4)',
    price: '₹160',
    meta: 'Chilled · No added sugar · 8 min',
    rating: 4.4,
    ratingCount: '4,210',
    highlights: ['<1 g sugar', 'Electrolyte added', 'Delivered chilled', 'Pack of 4'],
    detail: [
      'Freshly pressed lime with water and a pinch of salt; no added sugar.',
      'Under 1 g of sugar per 250 ml serving — the lowest of any drink in this list.',
      'Contains added sodium and potassium, which aid rehydration in hot weather.',
      'Delivered chilled from a dark store; typical delivery 8–12 minutes.',
      'Shelf life 48 hours refrigerated; intended for immediate consumption.',
      'Pack of four works out at ₹40 per bottle, against ₹55 for a single.',
      'Frequently out of stock during afternoon peak — the fresh range sells out fastest.',
      'Ranked second for hydration in nutritionist testing, behind coconut water.',
    ],
  },
  {
    id: 'd-p2',
    name: 'Tender Coconut Water — 200 ml (pack of 6)',
    price: '₹390',
    meta: 'Chilled · Natural electrolytes · 12 min',
    rating: 4.6,
    ratingCount: '8,934',
    highlights: ['Top hydration rating', 'Natural potassium', '15 g sugar', 'Best per-unit price'],
    detail: [
      'Tender coconut water with no added sugar; 15 g of naturally occurring sugar per 250 ml.',
      'Ranked first for hydration in nutritionist testing thanks to its natural electrolyte profile.',
      'High potassium content, which supports rehydration after heat exposure.',
      'Pack of six at ₹65 per unit, against ₹85 individually — a 24% per-unit saving.',
      'Delivered chilled; typical delivery 10–15 minutes.',
      'Clears the ₹299 free-delivery threshold on most apps as a single pack.',
      'Shelf life seven days refrigerated, unopened.',
      'Highest rated item in this category at 4.6 across 8,934 ratings.',
    ],
  },
  {
    id: 'd-p3',
    name: 'Mixed Fruit Juice — 1 L Carton',
    price: '₹120',
    meta: 'Ambient · From concentrate · 15 min',
    rating: 4.0,
    ratingCount: '12,650',
    highlights: ['Cheapest per litre', '"Nectar" — added sugar', '11 g sugar/100 ml', 'Long shelf life'],
    detail: [
      'Labelled as nectar, meaning 25–50% juice content with added sugar and water.',
      '11 g of sugar per 100 ml — approximately 27 g per 250 ml serving, comparable to a cola.',
      'From concentrate, shelf-stable, six-month shelf life unopened.',
      'Cheapest per litre in this list at ₹120, and the most economical option for a large group.',
      'Delivered ambient, not chilled — needs refrigeration time before serving.',
      'Ingredients list shows sugar as the second ingredient.',
      'Reliable stock levels; rarely unavailable even at peak times.',
      'Best value if cost is the priority; the weakest option on the sugar and hydration criteria.',
    ],
  },
  {
    id: 'd-p4',
    name: 'Iced Lemon Tea — 250 ml (pack of 4)',
    price: '₹200',
    meta: 'Chilled · Lightly sweetened · 10 min',
    rating: 4.2,
    ratingCount: '6,077',
    highlights: ['18 g sugar/serving', 'Caffeine ~20 mg', 'Chilled delivery', 'Popular combo item'],
    detail: [
      'Brewed black tea with lemon, lightly sweetened at 18 g of sugar per 250 ml serving.',
      'Contains roughly 20 mg of caffeine per serving — mild, but present.',
      'Sits between fresh juice and soft drinks on the sugar chart; the unsweetened version, where available, is under 1 g.',
      'Delivered chilled; typical delivery 10–14 minutes.',
      'Pack of four at ₹50 per bottle.',
      'Frequently bundled in snack combos, which are worthwhile only if the snacks were wanted anyway.',
      'Three-month shelf life; best served cold.',
      'Widely liked on taste; mid-table on the refreshment-duration measure because of the sugar load.',
    ],
  },
];

/* ------------------------------- Exports ------------------------------- */

export const SEARCH_RESULTS: Record<CategoryCode, SearchResult[]> = {
  L: LAPTOP_RESULTS,
  F: FOOTWEAR_RESULTS,
  H: COURSE_RESULTS,
  D: DRINKS_RESULTS,
};

export const LISTINGS: Record<CategoryCode, ListingItem[]> = {
  L: LAPTOP_LISTINGS,
  F: FOOTWEAR_LISTINGS,
  H: COURSE_LISTINGS,
  D: DRINKS_LISTINGS,
};

/**
 * Deterministic assistant replies. Keyword-matched against the corpus so the
 * AI channel presents the same evidence base as the other two channels.
 */
export function buildAiReply(
  category: CategoryCode,
  prompt: string,
): { text: string; citations: { label: string; url: string }[] } {
  const q = prompt.toLowerCase();
  const results = SEARCH_RESULTS[category];
  const listings = LISTINGS[category];
  const cite = (idxs: number[]) =>
    idxs.map((i) => ({ label: results[i].domain, url: results[i].url }));

  const has = (...words: string[]) => words.some((w) => q.includes(w));

  if (category === 'L') {
    if (has('battery', 'charge', 'backup'))
      return {
        text: `Measured battery life across the shortlist, in mixed use at 150 nits:\n\n• **Nimbus Slim 15** — 9h 05m, the best result under ₹70,000\n• **Vantage Book 14** — 8h 20m\n• **Vantage Pro 15** — 7h 40m, held back by its OLED panel\n• **CoreEdge 14** — 5h 15m\n\nIndependent testing found manufacturer claims run about **41% higher** than measured mixed use, so compare tested figures rather than box claims. Your brief asks for at least 4 hours, which all four clear — but battery health drops 15–20% over three years, so aim well above the minimum.`,
        citations: cite([2, 0]),
      };
    if (has('ram', 'memory', '16gb', '16 gb', '8gb', '8 gb'))
      return {
        text: `Your brief specifies at least 16 GB, and that is the right call.\n\nWindows 11 alone idles at about **4.1 GB**. Add a browser with fifteen tabs (2.8 GB), a video call (1.1 GB) and a spreadsheet (0.6 GB) and an 8 GB machine starts swapping to disk — which is what makes a laptop feel slow.\n\nThe critical detail: **much of this RAM is soldered**. On the shortlist, the Vantage Book 14 has a free SODIMM slot (upgradeable to 32 GB), the Nimbus Slim 15 is soldered at 16 GB, the CoreEdge 14 is soldered at 8 GB with no upgrade path, and the Vantage Pro 15 ships with 32 GB across two accessible slots.`,
        citations: cite([1, 0]),
      };
    if (has('compare', 'best', 'which', 'recommend', 'vs'))
      return {
        text: `Against your brief — MS Office, 14–15 inch, 16 GB+, 4h+ battery, ₹40,000–₹80,000:\n\n**${listings[1].name} — ${listings[1].price}**\n15.3" · 16 GB · 1 TB · 9h 05m measured. Best battery in the range and an aluminium chassis. RAM is soldered, so 16 GB is permanent.\n\n**${listings[0].name} — ${listings[0].price}**\n14" · 16 GB · 512 GB · 8h 20m. Cheaper, lighter at 1.4 kg, and the RAM is upgradeable to 32 GB.\n\n**${listings[3].name} — ${listings[3].price}**\n32 GB and a three-year on-site warranty included, at the very top of your budget.\n\nThe **CoreEdge 14** at ₹41,999 fails your brief on RAM — 8 GB soldered, no upgrade path.`,
        citations: cite([0, 1]),
      };
    if (has('office', 'ms office', 'microsoft', 'licence', 'license', 'software'))
      return {
        text: `Worth reading the box carefully here. Most retail units ship **Microsoft 365 Basic for 12 months**, which is a subscription — not a perpetual Office licence.\n\nOn the shortlist, the Vantage Book 14, Nimbus Slim 15 and Vantage Pro 15 all include 12 months. The CoreEdge 14 includes a **one-month trial only**.\n\nThe difference works out at roughly ₹6,000 over three years. Before paying, check whether your institution already provides Microsoft 365 free — many do.`,
        citations: cite([0, 4]),
      };
    if (has('warranty', 'service', 'repair', 'damage'))
      return {
        text: `Service reach is the most underrated specification for a laptop you carry daily.\n\n**On-site vs carry-in** is the key distinction — on-site means an engineer visits, carry-in means you lose the machine for days during term. Brands with on-site service in tier-2 cities saved an average of **11 days per repair**.\n\nOn the shortlist: the Vantage Book 14 and Nimbus Slim 15 include one-year on-site; the Vantage Pro 15 includes **three years on-site** (worth about ₹6,000); the CoreEdge 14 is carry-in only with no on-site option.\n\nAccidental damage cover is separate from warranty and runs ₹3,000–₹5,000 for three years. Spills and drops are the most common student claims.`,
        citations: cite([4, 5]),
      };
    if (has('price', 'cheap', 'budget', 'cost', 'buy', 'where'))
      return {
        text: `Within your ₹40,000–₹80,000 range:\n\n• ${listings[2].name} — **${listings[2].price}** (fails the 16 GB requirement)\n• ${listings[0].name} — **${listings[0].price}**\n• ${listings[1].name} — **${listings[1].price}**\n• ${listings[3].name} — **${listings[3].price}**\n\nOn where to buy: online is typically ₹2,000–₹5,000 cheaper on identical models, with deeper festival-sale discounts. Offline lets you test the keyboard and display first.\n\nTotal four-year cost usually runs **18–25% above** the sticker price once warranty extension and software are included. Also watch "no-cost EMI" offers that quietly remove an existing discount — compare the total payable, not the monthly figure.`,
        citations: cite([5, 4]),
      };
  }

  if (category === 'F') {
    if (has('waterproof', 'membrane', 'breathab', 'rain', 'wet'))
      return {
        text: `For a summer mountain trip, breathability usually beats waterproofing.\n\nA membrane blocks liquid water but also traps sweat. Testers reported **wetter feet inside waterproof shoes** than in mesh shoes in warm conditions.\n\nMesh shoes wet through quickly but dry within about an hour of walking. Membrane shoes, once flooded over the collar, stay wet for a day or more. Membranes also degrade after roughly 500 km unless cleaned regularly.\n\nChoose waterproof if you expect sustained rain or cold. Otherwise the **${listings[1].name}** (mesh, 310 g, ₹2,899) fits a warm-weather trek better than the waterproof ${listings[0].name}.`,
        citations: cite([1, 0]),
      };
    if (has('size', 'sizing', 'fit', 'big', 'small'))
      return {
        text: `Size up — this is the most common mistake and it causes the most common trekking injury.\n\nFeet swell **half to a full size** over a day of walking, more in heat. On descents the foot slides forward, which bruises and costs toenails.\n\nHow to fit: unlaced, slide your foot fully forward until your toes touch the front. You should fit **one finger behind your heel**. Measure in the evening, and always fit with the socks you will actually wear.\n\nThe category runs about half a size small overall. The ${listings[0].name} specifically runs half a size small; the ${listings[1].name} and ${listings[3].name} are true to size.\n\nLearn **heel lock lacing** using the top eyelets — it stops heel lift without over-tightening.`,
        citations: cite([2]),
      };
    if (has('light', 'weight', 'heavy'))
      return {
        text: `Weight compounds over distance — an extra 200 g per shoe was clearly noticeable after 15 km, and every tester ranked lighter pairs higher by the end of a long day.\n\nOn the shortlist:\n\n• **${listings[1].name}** — 310 g (lightest)\n• **${listings[3].name}** — 350 g\n• **${listings[0].name}** — 420 g\n• **${listings[2].name}** — 460 g (heaviest)\n\nThe weight generally buys ankle support and durability. The mid-cut pairs are heavier because of the reinforced collar and heel counter — genuinely useful on loose or rocky descents, but a real cost over a long day.`,
        citations: cite([0]),
      };
    if (has('grip', 'sole', 'traction', 'slip'))
      return {
        text: `Grip is the specification that matters most on a mountain trip and is quoted least.\n\n**Rubber compound beats tread pattern.** Softer compounds gripped wet rock dramatically better, but wore about 40% faster on tarmac.\n\nOn the shortlist, the ${listings[0].name} and ${listings[1].name} both use soft grip compounds — and the ₹2,899 Skyfell matched pairs at three times the price on wet rock. The ${listings[3].name} tested **below average on wet rock** despite the price.\n\nAlso check construction: stitched soles correlate with far lower separation rates. Sole separation was the top long-term complaint at 23% of reviews written after three months.`,
        citations: cite([0, 4]),
      };
    if (has('sale', 'discount', 'deal', 'cheap', 'budget', 'price', 'offer'))
      return {
        text: `The sale deals are real, with one caveat.\n\nIn testing, two budget pairs **matched a ₹9,000 benchmark on grip** — rubber compound is not always where manufacturers economise. Where budget pairs fell short was midsole durability: cushioning compressed after 80–120 km, against 400 km-plus for the benchmark.\n\nFor a single trip, a well-chosen budget pair is genuinely sufficient.\n\nTwo warnings. **Influencer-endorsed models showed no performance advantage** — the endorsement premium averaged ₹700. And watch inflated "original" prices: several models showed a 60% discount from a price the shoe had never sold at.\n\nBest value in testing was a ₹2,900 pair — which matches the **${listings[1].name}** at ₹2,899.`,
        citations: cite([3, 0]),
      };
    if (has('ankle', 'support', 'injur'))
      return {
        text: `Ankle support is a trade-off rather than a straight upgrade.\n\nMid-cut shoes **reduced ankle roll on uneven ground** but restricted movement and added weight. Low-cut shoes move freely and weigh less but offer no ankle protection on loose descents.\n\nFor a first mountain trip on unfamiliar terrain, mid-cut is the safer choice: the **${listings[0].name}** (₹4,299, 420 g) or the **${listings[2].name}** (₹8,999, 460 g, most secure heel counter in testing).\n\nIf the trail is well-maintained and you have walked distance before, the lighter low-cut ${listings[1].name} is reasonable.\n\nWhichever you choose, allow break-in time — never take a new pair straight onto a multi-day trek.`,
        citations: cite([0, 2]),
      };
  }

  if (category === 'H') {
    if (has('employer', 'value', 'worth', 'job', 'recognis', 'recogniz', 'career', 'resume', 'cv'))
      return {
        text: `From a survey of 400 hiring managers:\n\n**62% said a certificate alone changes nothing** — but **78% said a certificate plus a portfolio project materially improves a candidate.**\n\nRecognition varies sharply by issuer: university-affiliated and industry-issued certificates were recognised by over **70%**; generic marketplace certificates by **24%**.\n\nManagers also check whether you finished a **graded, proctored assessment** rather than just watching videos. The strongest single signal was a capstone project the candidate could talk through in an interview.\n\nOn this shortlist that points to the **${listings[0].name}** (industry-issued, capstone) or **${listings[2].name}** (university-issued, peer-graded).`,
        citations: cite([0, 1]),
      };
    if (has('free', 'paid', 'cost', 'price', 'cheap', 'aid', 'fee'))
      return {
        text: `Auditing is usually free; what you pay for is grading and the certificate.\n\n• **${listings[3].name}** — content free, ₹1,000 proctored exam fee. Best cost-to-recognition ratio here, and credit-transfer eligible.\n• **${listings[2].name}** — free to audit, ₹4,200 for the certificate track.\n• **${listings[1].name}** — ₹499 (listed at ₹3,999; list price is effectively nominal — never pay it).\n• **${listings[0].name}** — ₹3,999/month, with financial aid available and approved more often than learners expect.\n\nIf your goal is the **skill**, auditing free is often enough. If you need a **CV line**, you need the paid track. A common middle path: audit free to confirm the course suits you, then pay only if you intend to finish.`,
        citations: cite([3, 1]),
      };
    if (has('platform', 'coursera', 'udemy', 'edx', 'swayam', 'linkedin', 'compare', 'which', 'best'))
      return {
        text: `The platforms differ more in **model** than in catalogue, and the model tells you what the certificate is worth.\n\n**University-partnered** — institution-authored, graded assignments, often cohort-based with deadlines. Certificate carries the university name, which drives recognition.\n\n**Open marketplaces** — anyone can publish, so quality ranges widely within one catalogue. The instructor matters more than the platform. Self-paced with lifetime access.\n\n**Government-backed (SWAYAM)** — national institute faculty, usually free, with a paid proctored exam and sometimes formal credit transfer.\n\n**Professional-network platforms** — the credential sits directly in a profile recruiters already view.\n\nPractical order: choose the **instructor and syllabus** first, then check the **assessment format**, then compare price.`,
        citations: cite([1, 0]),
      };
    if (has('analytics', 'marketing', 'finance', 'data', 'which field', 'first'))
      return {
        text: `They reward different aptitudes and differ in time to job-readiness.\n\n**Data analytics** — needs comfort with numbers and logical structure. Core stack: spreadsheets, SQL, one visualisation tool, statistics underneath. **Four to six months** of consistent study including projects. Entry salaries tend to start higher.\n\n**Digital marketing** — needs writing, design sensibility and analytical follow-through. Core stack: search advertising, social platforms, analytics, content. **Two to four months**, partly because platform certifications are free and tied to tools employers already use. Wider salary spread, rewards demonstrable results.\n\nThey overlap in measurement — marketing roles increasingly expect analytics skill.\n\nIf undecided: start a short free course in each and see which one you still return to in **week three**.`,
        citations: cite([2, 0]),
      };
    if (has('finish', 'complete', 'drop', 'time', 'long', 'hours', 'week'))
      return {
        text: `Worth knowing before you enrol: median completion across large open courses is **5–15%**.\n\nThe strongest predictor of finishing is a **fixed weekly schedule** — learners who blocked specific hours finished at roughly **four times** the rate of those who studied when convenient. Second is course length: under six weeks finishes far more often than a multi-month specialisation. Deadlines help too, which is why cohort courses beat self-paced ones despite being less flexible.\n\nMost drop-off happens in **weeks two and three**.\n\nOn this shortlist, the ${listings[2].name} (7 weeks, ~6 h/week, weekly deadlines) is the most likely to be finished. The ${listings[0].name} advertises 6 months but most learners take **eight to nine**.\n\nStart with one short course, schedule fixed hours, and finish something before enrolling in anything else.`,
        citations: cite([4]),
      };
  }

  if (category === 'D') {
    if (has('hydrat', 'refresh', 'best', 'healthy', 'which drink', 'recommend'))
      return {
        text: `Ranked on hydration by nutritionists, which is mostly a question of sugar concentration — high-sugar drinks slow fluid absorption:\n\n1. **Coconut water** — natural electrolytes, ~6 g sugar/100 ml\n2. **Fresh lime water** (unsweetened) — cheapest effective option, near-zero sugar\n3. **Fresh fruit juice** — real nutrients, but 8–12 g sugar/100 ml and no fibre\n4. **Unsweetened iced tea** — performs well; sweetened bottled versions match soft drinks\n5. **Carbonated soft drinks** — 10–11 g sugar/100 ml, brief lift then a slump\n\nLow-sugar drinks kept testers comfortable roughly **twice as long** in heat.\n\nOne caveat: cold drinks *feel* more refreshing than they hydrate. Temperature drives the perception; sugar content drives the outcome.`,
        citations: cite([0, 3]),
      };
    if (has('sugar', 'calorie', 'diet'))
      return {
        text: `Sugar per 250 ml serving:\n\n• Packaged mango drink — **28 g** (higher than cola)\n• Cola — 26.5 g\n• Lemon-lime soda — 25 g\n• 100% orange juice — 22 g (all from fruit)\n• Sweetened bottled iced tea — 18 g\n• Coconut water — 15 g, with electrolytes\n• Fresh lime water, unsweetened — **under 1 g**\n• Sparkling/plain water — 0 g\n\nA single serving of cola exceeds the WHO daily added-sugar guideline.\n\nOn the shortlist: ${listings[0].name} is under 1 g, ${listings[1].name} is 15 g, ${listings[3].name} is 18 g, and ${listings[2].name} is ~27 g per serving.\n\nLabel tip: ignore the front of the pack. If sugar is in the first three ingredients, it is a sweetened drink — "nectar" and "juice drink" both mean added sugar.`,
        citations: cite([3, 1]),
      };
    if (has('juice', 'fresh', 'packaged', 'label', 'carton', 'concentrate'))
      return {
        text: `The labelling terms are regulated and specific:\n\n• **"100% juice"** — no added sugar, no water (~9 g sugar/100 ml)\n• **"Nectar"** — 25–50% juice, plus added sugar and water (~11 g/100 ml)\n• **"Juice drink"** — can be under 10% juice (~10 g/100 ml)\n\nAll three land close on sugar, but only one gets there entirely from fruit.\n\nFresh-pressed has the highest vitamin content but a shelf life measured in hours. Chilled preservative-free juices are closer to fresh than shelf-stable cartons and cost about 40% more. Juice with pulp retains some fibre, which slows sugar absorption slightly.\n\nThe **${listings[2].name}** on this list is labelled nectar — sugar is the second ingredient, and it arrives ambient rather than chilled.`,
        citations: cite([1, 3]),
      };
    if (has('app', 'deliver', 'fast', 'quick', 'time', 'blinkit', 'zepto', 'swiggy', 'zomato', 'bigbasket'))
      return {
        text: `From ordering an identical six-drink basket across five apps, at three times of day:\n\n**Delivery time** ranged 8–34 minutes. The fastest run dark stores within a 2 km radius.\n\n**Item prices** were within 6% of each other — the real difference was **fees**, which added ₹18–₹64 to the same basket. Small-order fees kick in below ₹99–₹199 depending on the app.\n\n**Stock reliability** differed most: fresh juice and coconut water were out of stock in **31% of afternoon orders** on the two fastest apps.\n\nRestaurant-delivery apps carry a wider fresh range but take 2–3× longer. Grocery-focused apps have the deepest packaged range and the best multi-pack prices, with slower slots.\n\nFor immediate chilled drinks the fastest app usually wins; for six or more, grocery apps are meaningfully cheaper per unit.`,
        citations: cite([2]),
      };
    if (has('group', 'friends', 'six', 'cheap', 'price', 'cost', 'split', 'order'))
      return {
        text: `Group ordering changes the economics mainly through **fee thresholds**, not item discounts.\n\n• Most apps waive delivery above ₹199–₹299 — a group order clears the threshold a single drink does not\n• Multi-packs of four or six cost **15–22% less per unit**\n• Five separate orders paid five sets of fees, costing **41% more** than the same items in one basket\n• Afternoon surge charges added ₹20–₹35\n\nCheapest structure for a group is packaged multi-packs plus a few fresh items:\n\n• **${listings[1].name}** — ${listings[1].price} (₹65/unit vs ₹85 single)\n• **${listings[0].name}** — ${listings[0].price} (₹40/bottle vs ₹55)\n• **${listings[2].name}** — ${listings[2].price}, cheapest per litre for a large group\n\nCombo deals are genuine savings only if you wanted the snacks anyway.`,
        citations: cite([4, 2]),
      };
  }

  // Generic fallback — still grounded in the same corpus.
  return {
    text: `Here is what the available sources say on that.\n\n**${results[0].title}** — ${results[0].snippet}\n\n**${results[1].title}** — ${results[1].snippet}\n\nAmong the options currently listed, **${listings[0].name}** (${listings[0].price}, ${listings[0].meta}) and **${listings[1].name}** (${listings[1].price}, ${listings[1].meta}) are the most frequently compared.\n\nAsk me about a specific attribute — price, quality, comparisons between options, or what to check before deciding — and I can go deeper.`,
    citations: cite([0, 1]),
  };
}
