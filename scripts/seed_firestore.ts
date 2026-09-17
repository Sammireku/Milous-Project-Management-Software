/**
 * Milous Project - Standalone Firestore Mock Data Seeding Script
 * Populates Firestore with realistic NGO project data across Users, Projects, Indicators, Tasks, and Expenses.
 * 
 * Usage:
 *   npm run seed
 *   npm run seed -- --clear
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';

// 1. Initialize Firebase Admin SDK
if (!getApps().length) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('✅ Initialized Firebase Admin SDK with Service Account Key:', serviceAccountPath);
  } else {
    // Fallback to default Cloud Run / GCP credentials or emulator
    initializeApp();
    console.log('ℹ️ Initialized Firebase Admin SDK with Default Application Credentials.');
  }
}

const db = getFirestore();

// Set random seed for reproducible yet realistic data
faker.seed(2025);

const COLLECTIONS = ['users', 'projects', 'indicators', 'tasks', 'expenses'];

/**
 * Helper to delete all documents in a collection in batches
 */
async function clearCollection(collectionName: string): Promise<number> {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) return 0;

  const batchSize = 500;
  let deletedCount = 0;
  let batch = db.batch();
  let countInBatch = 0;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    countInBatch++;
    deletedCount++;

    if (countInBatch >= batchSize) {
      await batch.commit();
      batch = db.batch();
      countInBatch = 0;
    }
  }

  if (countInBatch > 0) {
    await batch.commit();
  }

  console.log(`🧹 Cleared ${deletedCount} documents from '${collectionName}'`);
  return deletedCount;
}

/**
 * Main Seeding Pipeline
 */
async function seedFirestore() {
  console.log('\n🚀 Starting Firestore Mock Data Seeding Pipeline...');

  const shouldClear = process.argv.includes('--clear') || process.env.CLEAR_EXISTING === 'true';

  if (shouldClear) {
    console.log('\n🗑️ Clearing existing collections...');
    for (const col of COLLECTIONS) {
      await clearCollection(col);
    }
  }

  const now = new Date();
  
  // Helper to generate ISO dates spanning back over the last 6 months (180 days)
  const getRandomRecentDateISO = (daysBack = 180): string => {
    const date = faker.date.recent({ days: daysBack });
    return date.toISOString();
  };

  // ----------------------------------------------------------------------------
  // Step 1: Seed Users (3 Required Roles: PM, Field Officer, Finance Officer)
  // ----------------------------------------------------------------------------
  console.log('\n👤 1. Seeding Users (3 Roles)...');

  const usersData = [
    {
      id: 'usr-pm-01',
      email: 'kofi.mensah@milous-ngo.org',
      displayName: 'Kofi Mensah',
      role: 'PROJECT_MANAGER',
      organization: 'Milous NGO West Africa',
      assignedProjectIds: ['proj-gh-wash-2025', 'proj-gh-food-2025'],
      department: 'Program Management',
      phone: '+233 24 123 4567',
      isActive: true,
      createdAt: getRandomRecentDateISO(180),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr-field-01',
      email: 'ama.osei@milous-ngo.org',
      displayName: 'Ama Osei',
      role: 'FIELD_OFFICER',
      organization: 'Milous NGO West Africa',
      assignedProjectIds: ['proj-gh-wash-2025'],
      department: 'Field Operations - Northern District',
      phone: '+233 20 987 6543',
      isActive: true,
      createdAt: getRandomRecentDateISO(180),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr-fin-01',
      email: 'kwame.nkrumah@milous-ngo.org',
      displayName: 'Kwame Nkrumah',
      role: 'FINANCE_OFFICER',
      organization: 'Milous NGO West Africa',
      assignedProjectIds: ['proj-gh-wash-2025', 'proj-gh-food-2025'],
      department: 'Grant Accounting & Compliance',
      phone: '+233 27 555 1212',
      isActive: true,
      createdAt: getRandomRecentDateISO(180),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr-me-01',
      email: 'fatima.abubakar@milous-ngo.org',
      displayName: 'Fatima Abubakar',
      role: 'ME_OFFICER',
      organization: 'Milous NGO West Africa',
      assignedProjectIds: ['proj-gh-wash-2025', 'proj-gh-food-2025'],
      department: 'Monitoring & Evaluation',
      phone: '+233 26 333 4444',
      isActive: true,
      createdAt: getRandomRecentDateISO(180),
      updatedAt: new Date().toISOString(),
    }
  ];

  for (const u of usersData) {
    await db.collection('users').doc(u.id).set(u);
  }
  console.log(`✅ Seeded ${usersData.length} Users successfully.`);

  // ----------------------------------------------------------------------------
  // Step 2: Seed Projects (2 NGO Projects)
  // ----------------------------------------------------------------------------
  console.log('\n🏗️ 2. Seeding Projects (2 Projects)...');

  const projectsData = [
    {
      id: 'proj-gh-wash-2025',
      code: 'GH-WASH-2025',
      title: 'Northern Ghana Clean WASH & Sanitation Initiative',
      description: 'Construction of 50 solar-powered boreholes, community hygiene training, and sanitation facilities across Northern Region districts.',
      country: 'Ghana',
      location: 'Tamale, Yendi & Saveluga Districts',
      sector: 'WASH',
      status: 'ACTIVE',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-12-31T23:59:59.000Z',
      donors: [
        {
          donorCode: 'USAID',
          grantCode: 'AID-641-A-17-00042',
          totalAllocation: 300000,
          currency: 'USD',
          reportingCycle: 'QUARTERLY'
        },
        {
          donorCode: 'EU',
          grantCode: 'EU-ECHO-2025-WASH-GH',
          totalAllocation: 200000,
          currency: 'USD',
          reportingCycle: 'QUARTERLY'
        }
      ],
      totalBudget: 500000,
      leadManagerId: 'usr-pm-01',
      leadManagerName: 'Kofi Mensah',
      teamMemberIds: ['usr-field-01', 'usr-fin-01', 'usr-me-01'],
      createdAt: getRandomRecentDateISO(180),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'proj-gh-food-2025',
      code: 'GH-FOOD-2025',
      title: 'Sustainable Agriculture & Food Security Program',
      description: 'Distribution of drought-resistant climate seed kits and installation of drip-irrigation infrastructure for smallholder farmers.',
      country: 'Ghana',
      location: 'Upper East & Wa West Districts',
      sector: 'FOOD_SECURITY',
      status: 'ACTIVE',
      startDate: '2025-02-15T00:00:00.000Z',
      endDate: '2026-02-14T23:59:59.000Z',
      donors: [
        {
          donorCode: 'UNICEF',
          grantCode: 'UNICEF-WCA-FOOD-2025',
          totalAllocation: 250000,
          currency: 'USD',
          reportingCycle: 'MONTHLY'
        },
        {
          donorCode: 'FCDO',
          grantCode: 'FCDO-UK-AGRI-8812',
          totalAllocation: 150000,
          currency: 'USD',
          reportingCycle: 'QUARTERLY'
        }
      ],
      totalBudget: 400000,
      leadManagerId: 'usr-pm-01',
      leadManagerName: 'Kofi Mensah',
      teamMemberIds: ['usr-field-01', 'usr-fin-01'],
      createdAt: getRandomRecentDateISO(180),
      updatedAt: new Date().toISOString(),
    }
  ];

  for (const p of projectsData) {
    await db.collection('projects').doc(p.id).set(p);
  }
  console.log(`✅ Seeded ${projectsData.length} Projects successfully.`);

  // ----------------------------------------------------------------------------
  // Step 3: Seed Indicators (5 LogFrame Indicators)
  // ----------------------------------------------------------------------------
  console.log('\n📊 3. Seeding Indicators (5 Indicators)...');

  const indicatorsData = [
    {
      id: 'ind-wash-01',
      projectId: 'proj-gh-wash-2025',
      code: 'IND-01.1',
      title: 'Solar-Powered Boreholes Fully Installed and Operational',
      type: 'QUANTITATIVE',
      unit: 'Boreholes',
      baseline: 0,
      target: 50,
      actualValue: 28,
      autoSyncEnabled: true,
      history: [
        {
          id: 'hist-01',
          timestamp: getRandomRecentDateISO(60),
          previousValue: 27,
          newValue: 28,
          increment: 1,
          sourceTaskId: 'tsk-wash-101',
          sourceTaskTitle: 'Complete Tamale District Borehole #28 Drilling',
          triggeredByUserId: 'usr-field-01',
          note: 'Auto-incremented upon task completion verification'
        }
      ],
      createdAt: getRandomRecentDateISO(180),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ind-wash-02',
      projectId: 'proj-gh-wash-2025',
      code: 'IND-01.2',
      title: 'Community Members Trained in Water Sanitation & Hygiene',
      type: 'QUANTITATIVE',
      unit: 'Beneficiaries',
      baseline: 0,
      target: 2500,
      actualValue: 1850,
      autoSyncEnabled: true,
      history: [],
      createdAt: getRandomRecentDateISO(180),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ind-wash-03',
      projectId: 'proj-gh-wash-2025',
      code: 'IND-01.3',
      title: 'Institutional VIP Latrines Constructed in Schools',
      type: 'QUANTITATIVE',
      unit: 'Latrines',
      baseline: 0,
      target: 20,
      actualValue: 14,
      autoSyncEnabled: true,
      history: [],
      createdAt: getRandomRecentDateISO(180),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ind-food-01',
      projectId: 'proj-gh-food-2025',
      code: 'IND-02.1',
      title: 'Smallholder Farmers Provided Drought-Resistant Seed Kits',
      type: 'QUANTITATIVE',
      unit: 'Farmers',
      baseline: 0,
      target: 1200,
      actualValue: 940,
      autoSyncEnabled: true,
      history: [],
      createdAt: getRandomRecentDateISO(180),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ind-food-02',
      projectId: 'proj-gh-food-2025',
      code: 'IND-02.2',
      title: 'Hectares of Farmland Under Solar Drip Irrigation',
      type: 'QUANTITATIVE',
      unit: 'Hectares',
      baseline: 0,
      target: 150,
      actualValue: 85,
      autoSyncEnabled: true,
      history: [],
      createdAt: getRandomRecentDateISO(180),
      updatedAt: new Date().toISOString(),
    }
  ];

  for (const ind of indicatorsData) {
    await db.collection('indicators').doc(ind.id).set(ind);
  }
  console.log(`✅ Seeded ${indicatorsData.length} Indicators successfully.`);

  // ----------------------------------------------------------------------------
  // Step 4: Seed Tasks (20 Tasks across Kanban Lifecycle)
  // ----------------------------------------------------------------------------
  console.log('\n📋 4. Seeding Tasks (20 Tasks across Kanban statuses)...');

  const statuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'VERIFICATION', 'COMPLETED'] as const;
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

  const tasksData = [];

  const taskTemplates = [
    { title: 'Drill Borehole #29 in Yendi Central Community', proj: 'proj-gh-wash-2025', ind: 'ind-wash-01', inc: 1 },
    { title: 'Conduct WASH Hygiene Training Session for 150 Villagers', proj: 'proj-gh-wash-2025', ind: 'ind-wash-02', inc: 150 },
    { title: 'Inspect Construction of School Latrine Block A', proj: 'proj-gh-wash-2025', ind: 'ind-wash-03', inc: 1 },
    { title: 'Distribute 200 Climate Seed Kits to Upper East Farmers', proj: 'proj-gh-food-2025', ind: 'ind-food-01', inc: 200 },
    { title: 'Install Solar Drip Irrigation Pump Unit 12', proj: 'proj-gh-food-2025', ind: 'ind-food-02', inc: 10 },
    { title: 'Conduct Water Quality Fluoride Testing in Savelugu', proj: 'proj-gh-wash-2025', ind: 'ind-wash-01', inc: 1 },
    { title: 'Procure 500 Bags Portland Cement for Standpipes', proj: 'proj-gh-wash-2025', ind: undefined, inc: undefined },
    { title: 'Audit Field Equipment & Pump Maintenance Logs', proj: 'proj-gh-wash-2025', ind: undefined, inc: undefined },
    { title: 'Establish Community Water Management Committee', proj: 'proj-gh-wash-2025', ind: 'ind-wash-02', inc: 30 },
    { title: 'Soil Fertility Assessment in Wa West Agricultural Zones', proj: 'proj-gh-food-2025', ind: undefined, inc: undefined },
    { title: 'Train 50 Women-Led Farming Cooperatives in Drip Irrigation', proj: 'proj-gh-food-2025', ind: 'ind-food-01', inc: 50 },
    { title: 'Deliver Emergency Water Storage Tanks to Regional Clinic', proj: 'proj-gh-wash-2025', ind: undefined, inc: undefined },
    { title: 'Verify Borehole #28 Pump Pressure & GPS Coordinates', proj: 'proj-gh-wash-2025', ind: 'ind-wash-01', inc: 1 },
    { title: 'Quarterly USAID Grant Compliance Review & BVA Alignment', proj: 'proj-gh-wash-2025', ind: undefined, inc: undefined },
    { title: 'Field Demonstration: Drip Irrigation Solar Controllers', proj: 'proj-gh-food-2025', ind: 'ind-food-02', inc: 5 },
    { title: 'Procure High-Density Polyethylene Water Pipes (1000m)', proj: 'proj-gh-wash-2025', ind: undefined, inc: undefined },
    { title: 'Community Feedback Session on Hygiene Facilities', proj: 'proj-gh-wash-2025', ind: 'ind-wash-02', inc: 100 },
    { title: 'Seed Germination & Yield Stress Testing', proj: 'proj-gh-food-2025', ind: 'ind-food-01', inc: 100 },
    { title: 'Environmental & Social Safeguards Compliance Report', proj: 'proj-gh-wash-2025', ind: undefined, inc: undefined },
    { title: 'Final Handover of Savelugu Borehole Cluster', proj: 'proj-gh-wash-2025', ind: 'ind-wash-01', inc: 2 },
  ];

  for (let i = 0; i < taskTemplates.length; i++) {
    const tmpl = taskTemplates[i];
    // Distribute statuses across backlog, todo, in_progress, completed
    const status = i < 4 ? 'BACKLOG' : i < 8 ? 'TODO' : i < 13 ? 'IN_PROGRESS' : i < 15 ? 'VERIFICATION' : 'COMPLETED';
    const createdAt = getRandomRecentDateISO(180);
    const plannedStart = createdAt;
    const plannedEnd = faker.date.future({ years: 0.2, refDate: createdAt }).toISOString();

    const taskObj = {
      id: `tsk-${(i + 101).toString()}`,
      projectId: tmpl.proj,
      title: tmpl.title,
      description: faker.lorem.paragraph(),
      status,
      assigneeId: i % 2 === 0 ? 'usr-field-01' : 'usr-pm-01',
      assigneeName: i % 2 === 0 ? 'Ama Osei' : 'Kofi Mensah',
      priority: priorities[i % priorities.length],
      order: i,
      linkedIndicatorId: tmpl.ind,
      indicatorIncrementValue: tmpl.inc || 1,
      indicatorSyncApplied: status === 'COMPLETED' && !!tmpl.ind,
      plannedStartDate: plannedStart,
      plannedEndDate: plannedEnd,
      actualEndDate: status === 'COMPLETED' ? plannedEnd : undefined,
      dependencies: [],
      createdAt,
      updatedAt: new Date().toISOString(),
    };

    tasksData.push(taskObj);
    await db.collection('tasks').doc(taskObj.id).set(taskObj);
  }

  console.log(`✅ Seeded ${tasksData.length} Tasks successfully.`);

  // ----------------------------------------------------------------------------
  // Step 5: Seed Expenses (15 Expenses with Multi-Donor Splits)
  // ----------------------------------------------------------------------------
  console.log('\n💵 5. Seeding Expenses (15 Multi-Donor Expenses)...');

  const expenseCategories = ['PROCUREMENT', 'PERSONNEL', 'LOGISTICS', 'FIELD_OPS', 'EQUIPMENT', 'INDIRECT'] as const;
  const expenseStatuses = ['APPROVED', 'PENDING', 'APPROVED', 'APPROVED', 'AUDITED'] as const;

  const expenseDescriptions = [
    { desc: 'Procurement of 20 Submersible Solar Water Pumps', vendor: 'Volta River Hydro Solutions', proj: 'proj-gh-wash-2025', amt: 12500, donors: [{ code: 'USAID', pct: 60 }, { code: 'EU', pct: 40 }] },
    { desc: '500 Bags Portland Cement for Tamale Standpipes', vendor: 'Tamale Building Supplies Ltd', proj: 'proj-gh-wash-2025', amt: 4500, donors: [{ code: 'USAID', pct: 50 }, { code: 'EU', pct: 50 }] },
    { desc: 'Drip Irrigation Solar Controller Units (30 Sets)', vendor: 'AgriTech West Africa', proj: 'proj-gh-food-2025', amt: 9800, donors: [{ code: 'UNICEF', pct: 70 }, { code: 'FCDO', pct: 30 }] },
    { desc: 'Field Logistics & Off-Road Vehicle Fuel Allowance', vendor: 'Shell Ghana Logistics', proj: 'proj-gh-wash-2025', amt: 2100, donors: [{ code: 'USAID', pct: 50 }, { code: 'EU', pct: 50 }] },
    { desc: 'Drought-Resistant Seed Kit Distribution Procurement', vendor: 'Savannah Seed Co-op', proj: 'proj-gh-food-2025', amt: 15400, donors: [{ code: 'UNICEF', pct: 50 }, { code: 'FCDO', pct: 50 }] },
    { desc: 'Community Hygiene Training Materials & Flipcharts', vendor: 'Tamale Printing Press', proj: 'proj-gh-wash-2025', amt: 1200, donors: [{ code: 'USAID', pct: 100 }] },
    { desc: 'HDPE High Pressure Piping (1200 meters)', vendor: 'Accra Plastics & Pipes Ltd', proj: 'proj-gh-wash-2025', amt: 8300, donors: [{ code: 'USAID', pct: 60 }, { code: 'EU', pct: 40 }] },
    { desc: 'Soil Quality & Hydro-Geological Survey Specialist Fee', vendor: 'Ghana Institute of Geosciences', proj: 'proj-gh-food-2025', amt: 6500, donors: [{ code: 'UNICEF', pct: 60 }, { code: 'FCDO', pct: 40 }] },
    { desc: 'Heavy Machinery Well Excavation Rentals', vendor: 'Yendi Construction Equipment', proj: 'proj-gh-wash-2025', amt: 18000, donors: [{ code: 'USAID', pct: 50 }, { code: 'EU', pct: 50 }] },
    { desc: 'Solar Panel Mount Brackets & Inverters', vendor: 'SolarTech Ghana', proj: 'proj-gh-wash-2025', amt: 7200, donors: [{ code: 'EU', pct: 100 }] },
    { desc: 'Farmer Cooperative Workshop Catering & Venue', vendor: 'Wa Community Center', proj: 'proj-gh-food-2025', amt: 1850, donors: [{ code: 'UNICEF', pct: 50 }, { code: 'FCDO', pct: 50 }] },
    { desc: 'Water Testing Reagents & Portable Spectrophotometer', vendor: 'Global Scientific Supplies', proj: 'proj-gh-wash-2025', amt: 3400, donors: [{ code: 'USAID', pct: 70 }, { code: 'EU', pct: 30 }] },
    { desc: 'PPE Field Safety Helmets & High-Vis Vests', vendor: 'SafeWork West Africa', proj: 'proj-gh-wash-2025', amt: 950, donors: [{ code: 'USAID', pct: 50 }, { code: 'EU', pct: 50 }] },
    { desc: 'Submersible Pump Spare Parts & Repair Toolkits', vendor: 'Volta Hydro Spare Parts', proj: 'proj-gh-wash-2025', amt: 2800, donors: [{ code: 'USAID', pct: 80 }, { code: 'EU', pct: 20 }] },
    { desc: 'Quarterly Project Impact Evaluation Survey Honorariums', vendor: 'Northern Research Associates', proj: 'proj-gh-food-2025', amt: 5200, donors: [{ code: 'UNICEF', pct: 50 }, { code: 'FCDO', pct: 50 }] },
  ];

  const expensesData = [];

  for (let i = 0; i < expenseDescriptions.length; i++) {
    const item = expenseDescriptions[i];
    const dateIncurred = getRandomRecentDateISO(180);
    const status = expenseStatuses[i % expenseStatuses.length];

    const donorAllocations = item.donors.map((d) => ({
      donorCode: d.code,
      percentage: d.pct,
      allocatedAmount: Number(((item.amt * d.pct) / 100).toFixed(2)),
      budgetLineCode: `${d.code}-BL-${(i % 4 + 1)}.1`,
    }));

    const expenseObj = {
      id: `exp-${(i + 201).toString()}`,
      projectId: item.proj,
      taskId: `tsk-${(101 + (i % 20)).toString()}`,
      submittedById: 'usr-field-01',
      submittedByName: 'Ama Osei',
      approvedById: status === 'APPROVED' || status === 'AUDITED' ? 'usr-fin-01' : undefined,
      approvedByName: status === 'APPROVED' || status === 'AUDITED' ? 'Kwame Nkrumah' : undefined,
      status,
      totalAmount: item.amt,
      currency: 'USD',
      usdEquivalent: item.amt,
      dateIncurred: dateIncurred.split('T')[0],
      description: item.desc,
      vendor: item.vendor,
      category: expenseCategories[i % expenseCategories.length],
      donorAllocations,
      receiptUris: [
        `gs://milous-invoices/${item.proj}/receipt_${i + 1}.pdf`
      ],
      createdAt: dateIncurred,
      updatedAt: new Date().toISOString(),
    };

    expensesData.push(expenseObj);
    await db.collection('expenses').doc(expenseObj.id).set(expenseObj);
  }

  console.log(`✅ Seeded ${expensesData.length} Expenses successfully.`);

  console.log('\n🎉 Firestore Seeding Complete!');
  console.log('--------------------------------------------------');
  console.log(`Users:      ${usersData.length}`);
  console.log(`Projects:   ${projectsData.length}`);
  console.log(`Indicators: ${indicatorsData.length}`);
  console.log(`Tasks:      ${tasksData.length}`);
  console.log(`Expenses:   ${expensesData.length}`);
  console.log('--------------------------------------------------\n');
}

// Execute script
seedFirestore().catch((err) => {
  console.error('❌ Error seeding Firestore database:', err);
  process.exit(1);
});
