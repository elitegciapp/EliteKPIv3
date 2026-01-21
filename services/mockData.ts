
const now = new Date();
const daysAgo = (n) => {
    const d = new Date(now.getTime() - (n * 24 * 60 * 60 * 1000));
    return d.toISOString();
};

const leadSources = ['Zillow', 'Realtor.com', 'Referral', 'SOI', 'Open House', 'Ad Calls'];

const createBuyerLeads = (count) => {
    const leads = [];
    for (let i = 1; i <= count; i++) {
        leads.push({
            id: `demo-buyer-lead-${i}`,
            name: `Client ${i}`,
            propertyAddress: `TBD - Search Area ${i}`,
            propertyPrice: 450000,
            dealSide: 'BUYER',
            stage: 'LEAD',
            stageEnteredAt: daysAgo(Math.floor(Math.random() * 10)),
            closeProbabilityBps: 1000,
            commissionEarned: 0,
            createdAt: daysAgo(Math.floor(Math.random() * 20)),
            leadSource: leadSources[i % leadSources.length],
            notes: 'Initial inquiry.'
        });
    }
    return leads;
};

export const mockData = {
    deals: [
        ...createBuyerLeads(15),
        {
            id: 'demo-seller-1',
            name: 'John & Jane Doe',
            propertyAddress: '1420 Luxury Lane',
            propertyPrice: 950000,
            dealSide: 'SELLER',
            stage: 'SHOWING_OR_ACTIVE',
            stageEnteredAt: daysAgo(10),
            closeProbabilityBps: 5000,
            commissionEarned: 0,
            createdAt: daysAgo(60),
            leadSource: 'SOI',
            listingDate: daysAgo(30)
        },
        {
            id: 'demo-closed-1',
            name: 'Robert Smith',
            propertyAddress: '550 Park Avenue Penthouse',
            propertyPrice: 1500000,
            dealSide: 'BUYER',
            stage: 'CLOSED',
            stageEnteredAt: daysAgo(45),
            closeProbabilityBps: 10000,
            commissionEarned: 45000,
            createdAt: daysAgo(100),
            closedAt: daysAgo(45),
            leadSource: 'Zillow Preferred'
        }
    ],
    expenses: [],
    activities: []
};
