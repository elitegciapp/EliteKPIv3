
// Pure JavaScript mock data.
// NO imports, NO enums, NO types.

const now = new Date();
const daysAgo = (n) => {
    const d = new Date(now.getTime() - (n * 24 * 60 * 60 * 1000));
    return d.toISOString();
};

const leadSources = ['Zillow', 'Realtor.com', 'Referral', 'SOI', 'Open House', 'Ad Calls'];

// Helper to create buyer leads
const createBuyerLeads = (count) => {
    const leads = [];
    for (let i = 1; i <= count; i++) {
        leads.push({
            id: `demo-buyer-lead-${i}`,
            name: `Buyer Lead ${i} - ${leadSources[i % leadSources.length]}`,
            dealSide: 'BUYER',
            stage: 'LEAD',
            stageEnteredAt: daysAgo(Math.floor(Math.random() * 10)),
            closeProbabilityBps: 1000, // 10%
            expectedGci: 12000,
            createdAt: daysAgo(Math.floor(Math.random() * 20)),
            leadSource: leadSources[i % leadSources.length],
            notes: 'Initial inquiry via web form.'
        });
    }
    return leads;
};

const buyerLeads = createBuyerLeads(25);

export const mockData = {
    deals: [
        ...buyerLeads,
        // Active Seller Listings
        {
            id: 'demo-seller-1',
            name: '1420 Luxury Lane',
            dealSide: 'SELLER',
            stage: 'SHOWING_OR_ACTIVE',
            stageEnteredAt: daysAgo(10),
            closeProbabilityBps: 5000, // 50%
            expectedGci: 28500,
            createdAt: daysAgo(60),
            leadSource: 'SOI',
            notes: 'High interest, 2 showings scheduled.',
            listPrice: 950000,
            commissionRatePct: 3,
            expectedCommission: 28500,
            listingDate: daysAgo(30)
        },
        {
            id: 'demo-seller-2',
            name: '88 Ridge Road',
            dealSide: 'SELLER',
            stage: 'SHOWING_OR_ACTIVE',
            stageEnteredAt: daysAgo(5),
            closeProbabilityBps: 5000, // 50%
            expectedGci: 25500,
            createdAt: daysAgo(15),
            leadSource: 'Farming',
            listPrice: 850000,
            commissionRatePct: 3,
            expectedCommission: 25500,
            listingDate: daysAgo(15)
        },
        // Under Contract
        {
            id: 'demo-uc-1',
            name: '22 Sunset Boulevard',
            dealSide: 'BUYER',
            stage: 'UNDER_CONTRACT',
            stageEnteredAt: daysAgo(12),
            closeProbabilityBps: 9000, // 90%
            expectedGci: 18000,
            createdAt: daysAgo(45),
            leadSource: 'Open House'
        },
        {
            id: 'demo-uc-2',
            name: '900 Ocean View Drive',
            dealSide: 'SELLER',
            stage: 'PENDING_CLOSE',
            stageEnteredAt: daysAgo(2),
            closeProbabilityBps: 9500, // 95%
            expectedGci: 62500,
            createdAt: daysAgo(90),
            leadSource: 'Referral',
            listPrice: 2500000,
            commissionRatePct: 2.5,
            expectedCommission: 62500,
            listingDate: daysAgo(90)
        },
        // Closed Deals (Closed in current year)
        {
            id: 'demo-closed-1',
            name: '550 Park Avenue Penthouse',
            dealSide: 'BUYER',
            stage: 'CLOSED',
            stageEnteredAt: daysAgo(45),
            closeProbabilityBps: 10000, // 100%
            expectedGci: 42000,
            actualGci: 42000,
            createdAt: daysAgo(100),
            closedAt: daysAgo(45),
            leadSource: 'Zillow Preferred'
        },
        {
            id: 'demo-closed-2',
            name: '101 Pine Street',
            dealSide: 'SELLER',
            stage: 'CLOSED',
            stageEnteredAt: daysAgo(15),
            closeProbabilityBps: 10000,
            expectedGci: 15000,
            actualGci: 15500,
            createdAt: daysAgo(120),
            closedAt: daysAgo(15),
            leadSource: 'SOI',
            listPrice: 500000,
            closedPrice: 516000,
            commissionRatePct: 3,
            expectedCommission: 15000,
            listingDate: daysAgo(120),
            daysOnMarket: 105,
            priceVariance: 16000
        }
    ],
    expenses: [
        {
            id: 'demo-exp-1',
            dealId: 'demo-seller-1',
            dealSide: 'SELLER',
            type: 'Standard Expense',
            category: 'Professional Photography',
            date: daysAgo(55),
            quantity: 1,
            costPerUnit: 450,
            totalCost: 450,
            notes: 'Drone + Interior',
            milesDriven: 0, mpg: 0, gasPrice: 0, gallonsUsed: 0, fuelCost: 0
        },
        {
            id: 'demo-exp-2',
            dealId: 'demo-closed-1',
            dealSide: 'BUYER',
            type: 'Standard Expense',
            category: 'Client Meals',
            date: daysAgo(46),
            quantity: 1,
            costPerUnit: 185.50,
            totalCost: 185.50,
            notes: 'Closing dinner',
            milesDriven: 0, mpg: 0, gasPrice: 0, gallonsUsed: 0, fuelCost: 0
        }
    ],
    activities: [
        {
            id: 'demo-act-1',
            dealId: 'demo-seller-1',
            dealSide: 'SELLER',
            category: 'Open House',
            date: daysAgo(2),
            notes: 'Hosted open house, 5 groups.'
        }
    ]
};
