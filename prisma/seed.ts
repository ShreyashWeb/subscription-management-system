import { PrismaClient, Role, BillingPeriod, InvoiceStatus, SubscriptionStatus, DiscountType, DiscountScope } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays, subMonths, format, startOfMonth } from "date-fns";
import { today } from "../src/lib/dates";
import { billingService } from "../src/server/services/billing";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10;

// Deterministic Mulberry32 Pseudo-Random Number Generator (Seed = 42)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

function randomInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const INDIAN_COMPANIES = [
  "Acme Corp Ltd.",
  "Reliance Digital Systems",
  "Tata Cloud Dynamics",
  "Infosys NextGen Solutions",
  "Wipro Enterprise Infra",
  "HCL Global Software",
  "Mahindra Tech Ventures",
  "L&T Smart Analytics",
  "Adani Network Services",
  "Bharti Airtel Commercial",
  "Zomato Merchant Ops",
  "Swiggy Logistics Cloud",
  "Razorpay Integrations",
  "Paytm Enterprise Tech",
  "Zerodha Financial API",
  "Freshworks Partner Tech",
  "Zoho Premium Deployments",
  "Postman API Engineering",
  "Cred Banking Systems",
  "Flipkart Supply Chain",
];

const FIRST_NAMES = [
  "Aarav", "Aditi", "Rohan", "Ananya", "Vikram", "Pooja", "Rahul", "Priya",
  "Karan", "Sneha", "Arjun", "Neha", "Siddharth", "Divya", "Amit", "Kavita",
  "Nikhil", "Shreya", "Gaurav", "Meera", "Varun", "Tanvi", "Akash", "Ritu",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Mehta", "Reddy", "Nair", "Iyer", "Choudhury",
  "Gupta", "Singh", "Joshi", "Bose", "Kulkarni", "Deshmukh", "Menon", "Pillai",
];

async function main() {
  console.log("🌱 Starting deterministic Brightloop Billing database seed (seed: 42)...");
  const seedStart = performance.now();
  const now = today();

  // 1. Seed Demo Users
  console.log("  → Seeding demo users and customer pool (~300 customers)...");
  const demoPasswordHash = await bcrypt.hash("Admin@12345", BCRYPT_ROUNDS);
  const staffPasswordHash = await bcrypt.hash("Staff@12345", BCRYPT_ROUNDS);
  const customerPasswordHash = await bcrypt.hash("Customer@12345", BCRYPT_ROUNDS);

  const demoUsers = [
    {
      email: "admin@brightloop.test",
      name: "Brightloop Admin",
      role: Role.ADMIN,
      passwordHash: demoPasswordHash,
      company: "Brightloop Software Inc.",
    },
    {
      email: "staff@brightloop.test",
      name: "Operations Staff",
      role: Role.STAFF,
      passwordHash: staffPasswordHash,
      company: "Brightloop Operations",
    },
    {
      email: "customer@brightloop.test",
      name: "Acme Enterprise Customer",
      role: Role.CUSTOMER,
      passwordHash: customerPasswordHash,
      company: "Acme Corp Ltd.",
    },
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    });
  }

  // Create ~300 customers deterministically
  const customerUsersData: Array<{
    email: string;
    name: string;
    role: Role;
    passwordHash: string;
    company: string;
  }> = [];

  for (let i = 1; i <= 300; i++) {
    const fName = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const lName = LAST_NAMES[(i * 13) % LAST_NAMES.length];
    const company = INDIAN_COMPANIES[i % INDIAN_COMPANIES.length];
    customerUsersData.push({
      email: `customer${i}@brightloop.test`,
      name: `${fName} ${lName}`,
      role: Role.CUSTOMER,
      passwordHash: customerPasswordHash,
      company: `${company} #${i}`,
    });
  }

  // Upsert in batches
  for (const cust of customerUsersData) {
    await prisma.user.upsert({
      where: { email: cust.email },
      update: { name: cust.name, company: cust.company },
      create: cust,
    });
  }

  const allCustomers = await prisma.user.findMany({
    where: { role: Role.CUSTOMER },
    select: { id: true, email: true },
  });
  const demoCustomer = allCustomers.find((c) => c.email === "customer@brightloop.test")!;
  console.log(`  ✓ Demo logins & ${allCustomers.length} customer accounts verified.`);

  // 2. Seed Tax Rules
  console.log("  → Seeding tax rules...");
  const taxDefs = [
    { name: "GST 18%", rateBps: 1800, active: true },
    { name: "GST 12%", rateBps: 1200, active: true },
    { name: "GST 5%", rateBps: 500, active: true },
    { name: "Tax Exempt (0%)", rateBps: 0, active: true },
  ];

  for (const t of taxDefs) {
    const ex = await prisma.tax.findFirst({ where: { name: t.name } });
    if (!ex) await prisma.tax.create({ data: t });
  }
  const taxes = await prisma.tax.findMany();
  console.log(`  ✓ ${taxes.length} Tax rules active.`);

  // 3. Seed Products and Variants (12 commercial products including Odoo +560)
  console.log("  → Seeding 12 products with variants...");
  const productDefs = [
    {
      name: "Cloud ERP Core License",
      type: "Software",
      salesPrice: 100000,
      costPrice: 40000,
      notes: "Base core license required for all ERP modules.",
      variants: [
        { attribute: "Brand", value: "Odoo", extraPrice: 56000 },
        { attribute: "Brand", value: "Standard", extraPrice: 0 },
        { attribute: "Deployment", value: "Dedicated Cloud", extraPrice: 200000 },
      ],
    },
    {
      name: "Advanced Financial Analytics",
      type: "Add-on",
      salesPrice: 250000,
      costPrice: 50000,
      notes: "Cashflow forecasting, multidimensional reports.",
      variants: [
        { attribute: "Tier", value: "Pro", extraPrice: 50000 },
        { attribute: "Tier", value: "Enterprise", extraPrice: 150000 },
      ],
    },
    {
      name: "24/7 Priority Support SLA",
      type: "Service",
      salesPrice: 500000,
      costPrice: 150000,
      notes: "15-minute response time guarantee.",
      variants: [],
    },
    {
      name: "Automated Bank Reconciliation",
      type: "Add-on",
      salesPrice: 120000,
      costPrice: 20000,
      notes: "Real-time bank feed sync.",
      variants: [],
    },
    {
      name: "Global Payroll & Tax Engine",
      type: "Software",
      salesPrice: 350000,
      costPrice: 80000,
      notes: "Multi-state compliance and automated filings.",
      variants: [
        { attribute: "Scale", value: "Up to 500 Employees", extraPrice: 100000 },
      ],
    },
    {
      name: "Enterprise Warehouse Barcode Suite",
      type: "Software",
      salesPrice: 180000,
      costPrice: 45000,
      notes: "Direct scanner integration and mobile picker app.",
      variants: [],
    },
    {
      name: "Dedicated Account Manager SLA",
      type: "Service",
      salesPrice: 400000,
      costPrice: 120000,
      notes: "Dedicated CSM for monthly business reviews.",
      variants: [],
    },
    {
      name: "Custom Integration Webhooks",
      type: "Add-on",
      salesPrice: 80000,
      costPrice: 15000,
      notes: "High throughput webhook dispatchers.",
      variants: [],
    },
    {
      name: "SOC-2 Audit & Compliance Vault",
      type: "Add-on",
      salesPrice: 220000,
      costPrice: 40000,
      notes: "Tamper-proof immutable audit logging.",
      variants: [],
    },
    {
      name: "CRM Sales Acceleration Pack",
      type: "Software",
      salesPrice: 195000,
      costPrice: 35000,
      notes: "Pipeline intelligence and email tracking.",
      variants: [],
    },
    {
      name: "eCommerce Headless Sync Connector",
      type: "Add-on",
      salesPrice: 140000,
      costPrice: 25000,
      notes: "Shopify and WooCommerce bidirectional sync.",
      variants: [],
    },
    {
      name: "White Glove Migration Advisory",
      type: "Service",
      salesPrice: 750000,
      costPrice: 250000,
      notes: "End-to-end data cleansing and onboarding.",
      variants: [],
    },
  ];

  for (const p of productDefs) {
    const existing = await prisma.product.findFirst({
      where: { name: p.name },
      include: { variants: true },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          type: p.type,
          salesPrice: p.salesPrice,
          costPrice: p.costPrice,
          notes: p.notes,
          active: true,
          variants: {
            create: p.variants.map((v) => ({
              attribute: v.attribute,
              value: v.value,
              extraPrice: v.extraPrice,
            })),
          },
        },
      });
    }
  }

  const products = await prisma.product.findMany({ include: { variants: true } });
  console.log(`  ✓ ${products.length} Products configured.`);

  // 4. Seed Plans (Multi-Period + Special Flags)
  console.log("  → Seeding subscription plans...");
  const planDefs = [
    {
      name: "Daily Developer Sandbox",
      price: 20000,
      period: BillingPeriod.DAILY,
      minQty: 1,
      availableFrom: new Date("2024-01-01"),
      autoClose: false,
      closable: true,
      pausable: false,
      renewable: true,
      trialDays: 0,
      active: true,
    },
    {
      name: "Weekly Growth Sprint",
      price: 150000,
      period: BillingPeriod.WEEKLY,
      minQty: 1,
      availableFrom: new Date("2024-01-01"),
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      trialDays: 3,
      active: true,
    },
    {
      name: "Professional Monthly",
      price: 485000,
      period: BillingPeriod.MONTHLY,
      minQty: 1,
      availableFrom: new Date("2024-01-01"),
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      trialDays: 14,
      active: true,
    },
    {
      name: "Enterprise Annual Plan",
      price: 4800000,
      period: BillingPeriod.YEARLY,
      minQty: 5,
      availableFrom: new Date("2024-01-01"),
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      trialDays: 30,
      active: true,
    },
    {
      name: "Fixed-Term Pilot (Non-Closable)",
      price: 350000,
      period: BillingPeriod.MONTHLY,
      minQty: 1,
      availableFrom: new Date("2024-01-01"),
      autoClose: true,
      closable: false,
      pausable: false,
      renewable: false,
      trialDays: 0,
      active: true,
    },
    {
      name: "Upcoming Visionary 2027",
      price: 6000000,
      period: BillingPeriod.YEARLY,
      minQty: 10,
      availableFrom: new Date("2027-01-01"),
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      trialDays: 30,
      active: true,
    },
    {
      name: "Legacy Promo 2024 (Expired)",
      price: 299900,
      period: BillingPeriod.MONTHLY,
      minQty: 1,
      availableFrom: new Date("2024-01-01"),
      availableTo: new Date("2024-12-31"),
      autoClose: true,
      closable: true,
      pausable: false,
      renewable: false,
      trialDays: 0,
      active: true,
    },
  ];

  for (const pl of planDefs) {
    const existing = await prisma.plan.findFirst({ where: { name: pl.name } });
    if (!existing) await prisma.plan.create({ data: pl });
  }

  const plans = await prisma.plan.findMany();
  const monthlyPlan = plans.find((p) => p.period === BillingPeriod.MONTHLY)!;
  const yearlyPlan = plans.find((p) => p.period === BillingPeriod.YEARLY)!;
  const weeklyPlan = plans.find((p) => p.period === BillingPeriod.WEEKLY)!;
  const dailyPlan = plans.find((p) => p.period === BillingPeriod.DAILY)!;
  console.log(`  ✓ ${plans.length} Plans available.`);

  // 5. Seed Quotation Templates
  console.log("  → Seeding quotation templates...");
  const templateDefs = [
    { name: "Starter SaaS Bundle", planId: monthlyPlan.id, validityDays: 30 },
    { name: "Enterprise Cloud Suite", planId: yearlyPlan.id, validityDays: 45 },
    { name: "Agile Development Sprint", planId: weeklyPlan.id, validityDays: 14 },
  ];

  for (const td of templateDefs) {
    const ex = await prisma.quotationTemplate.findFirst({ where: { name: td.name } });
    if (!ex) {
      const tpl = await prisma.quotationTemplate.create({ data: td });
      await prisma.templateLine.create({
        data: {
          templateId: tpl.id,
          productId: products[0].id,
          variantId: products[0].variants[0]?.id ?? null,
          quantity: 1,
        },
      });
    }
  }

  // 6. Seed Discounts (including Demo story discount: usageLimit=2, usedCount=1)
  console.log("  → Seeding promotional and demo discounts...");
  const discountDefs = [
    // Requirement 2: Demo Story discount with usageLimit 2 and usedCount 1
    {
      name: "Startup Boost 20%",
      type: DiscountType.PERCENT,
      value: 2000, // 20%
      minPurchase: 0,
      minQty: 0,
      startDate: new Date("2025-01-01"),
      endDate: null,
      usageLimit: 2,
      usedCount: 1,
      scope: DiscountScope.SUBSCRIPTION,
      active: true,
    },
    {
      name: "Early Adopter Flat ₹1,000 Off",
      type: DiscountType.FIXED,
      value: 100000, // ₹1,000.00
      minPurchase: 250000,
      minQty: 1,
      startDate: new Date("2025-01-01"),
      endDate: null,
      usageLimit: 100,
      usedCount: 42,
      scope: DiscountScope.SUBSCRIPTION,
      active: true,
    },
    {
      name: "Black Friday Exhausted",
      type: DiscountType.PERCENT,
      value: 3000, // 30%
      minPurchase: 0,
      minQty: 0,
      startDate: new Date("2024-11-01"),
      endDate: new Date("2026-12-31"),
      usageLimit: 10,
      usedCount: 10, // Exhausted
      scope: DiscountScope.SUBSCRIPTION,
      active: true,
    },
    {
      name: "Q1 2024 Flash Promo (Expired)",
      type: DiscountType.PERCENT,
      value: 1500, // 15%
      minPurchase: 0,
      minQty: 0,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-03-31"), // Expired
      usageLimit: 50,
      usedCount: 12,
      scope: DiscountScope.SUBSCRIPTION,
      active: true,
    },
  ];

  for (const d of discountDefs) {
    const ex = await prisma.discount.findFirst({ where: { name: d.name } });
    if (!ex) await prisma.discount.create({ data: d });
  }
  console.log("  ✓ Seeded discounts with demo story usage tracking (1/2 used).");

  // 7. Generate ~2,000 subscriptions and 6,000+ invoices (batch optimized)
  console.log("  → Generating ~2,000 subscriptions and 6,000+ invoices (batch optimized)...");

  // Clear existing operational records via TRUNCATE CASCADE for instant atomic reset
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "DunningReminder", "Payment", "InvoiceLine", "Invoice", "SubscriptionLine", "Subscription", "ActivityLog" CASCADE;
  `);

  // 7. Seed Demo Story: "Acme Retail" exactly three periods behind!
  // Customer: customer@brightloop.test (Acme Enterprise Customer)
  // 3 periods behind: nextInvoiceDate = subMonths(now, 2)
  const acmeSub = await prisma.subscription.create({
      data: {
        number: "SUB-2025-00001",
        customerId: demoCustomer.id,
        planId: monthlyPlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: subMonths(now, 4),
        nextInvoiceDate: subMonths(now, 2), // 3 periods behind! (Month -2, Month -1, Month 0)
        paymentTermsDays: 15,
        isPaused: false,
      },
    });

    await prisma.subscriptionLine.create({
      data: {
        subscriptionId: acmeSub.id,
        productId: products[0].id,
        variantId: products[0].variants[0]?.id ?? null, // Odoo variant (+560)
        quantity: 2,
        unitPrice: 156000,
        taxId: taxes[0].id, // 18%
      },
    });

    // Create Acme Retail's historical paid invoices (months 4 & 3 ago)
    const acmeHistoricalPeriod1Start = subMonths(now, 4);
    const acmeHistoricalPeriod1End = subDays(subMonths(now, 3), 1);
    const acmeInv1 = await prisma.invoice.create({
      data: {
        number: "INV-2025-000001",
        subscriptionId: acmeSub.id,
        customerId: demoCustomer.id,
        status: InvoiceStatus.PAID,
        issueDate: acmeHistoricalPeriod1Start,
        dueDate: addDays(acmeHistoricalPeriod1Start, 15),
        periodStart: acmeHistoricalPeriod1Start,
        periodEnd: acmeHistoricalPeriod1End,
        subtotal: 312000,
        discountTotal: 0,
        taxTotal: 56160,
        total: 368160,
        paidTotal: 368160,
      },
    });

    await prisma.payment.create({
      data: {
        invoiceId: acmeInv1.id,
        method: "BANK_TRANSFER",
        amount: 368160,
        paidOn: addDays(acmeHistoricalPeriod1Start, 2),
        note: "Acme initial period payment",
      },
    });

    // Month 3 invoice (applied Demo discount: Startup Boost 20%)
    const acmeHistoricalPeriod2Start = subMonths(now, 3);
    const acmeHistoricalPeriod2End = subDays(subMonths(now, 2), 1);
    const acmeInv2 = await prisma.invoice.create({
      data: {
        number: "INV-2025-000002",
        subscriptionId: acmeSub.id,
        customerId: demoCustomer.id,
        status: InvoiceStatus.PAID,
        issueDate: acmeHistoricalPeriod2Start,
        dueDate: addDays(acmeHistoricalPeriod2Start, 15),
        periodStart: acmeHistoricalPeriod2Start,
        periodEnd: acmeHistoricalPeriod2End,
        subtotal: 312000,
        discountTotal: 62400, // 20% discount applied
        taxTotal: 44928,
        total: 294528,
        paidTotal: 294528,
      },
    });

    await prisma.payment.create({
      data: {
        invoiceId: acmeInv2.id,
        method: "CARD",
        amount: 294528,
        paidOn: addDays(acmeHistoricalPeriod2Start, 3),
        note: "Acme period 2 with discount",
      },
    });

    console.log("  ✓ Demo Story: 'Acme Retail' created (exactly 3 periods behind, discount used 1/2).");

    // 8. Generate ~2,000 subscriptions
    const subBatch: any[] = [];
    const subLineBatch: any[] = [];
    const invoiceBatch: any[] = [];
    const invoiceLineBatch: any[] = [];
    const paymentBatch: any[] = [];
    const reminderBatch: any[] = [];
    const activityBatch: any[] = [];

    const TOTAL_SUBS = 2000;
    const activePlans = [monthlyPlan, yearlyPlan, weeklyPlan, dailyPlan];

    let invoiceCounter = 10;
    let subCounter = 10;

    for (let i = 1; i < TOTAL_SUBS; i++) {
      subCounter++;
      const cust = allCustomers[i % allCustomers.length];
      const plan = activePlans[i % activePlans.length];

      // Status distribution: ~60% ACTIVE, 15% CONFIRMED, 15% CLOSED, 5% DRAFT, 5% QUOTATION
      const roll = rng();
      let status: SubscriptionStatus = SubscriptionStatus.ACTIVE;
      let isPaused = false;

      if (roll < 0.60) {
        status = SubscriptionStatus.ACTIVE;
        if (roll < 0.05 && plan.pausable) isPaused = true;
      } else if (roll < 0.75) {
        status = SubscriptionStatus.CONFIRMED;
      } else if (roll < 0.90) {
        status = SubscriptionStatus.CLOSED;
      } else if (roll < 0.95) {
        status = SubscriptionStatus.DRAFT;
      } else {
        status = SubscriptionStatus.QUOTATION;
      }

      // Realistic start dates based on lifecycle status
      let startDate: Date;
      let monthsAgo = 1;
      if (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.CLOSED) {
        monthsAgo = randomInt(1, 14);
        startDate = subMonths(now, monthsAgo);
      } else {
        // CONFIRMED, DRAFT, QUOTATION are upcoming quotes and signed sales waiting for start
        startDate = addDays(now, randomInt(1, 30));
      }
      const subId = `sub-det-${i}`;
      const subNum = `SUB-2025-${String(subCounter).padStart(5, "0")}`;

      // Pick 1-2 products
      const prod = products[i % products.length];
      const variant = prod.variants.length > 0 ? prod.variants[0] : null;
      const tax = taxes[i % taxes.length];
      const unitPrice = prod.salesPrice + (variant?.extraPrice ?? 0);
      const qty = randomInt(1, 4);

      subLineBatch.push({
        id: `sl-${i}`,
        subscriptionId: subId,
        productId: prod.id,
        variantId: variant?.id ?? null,
        taxId: tax.id,
        quantity: qty,
        unitPrice,
      });

      // Calculate historical invoices for ACTIVE and CLOSED subscriptions
      let nextInvoiceDate = startDate;
      const closedAtDate = status === SubscriptionStatus.CLOSED ? subDays(now, randomInt(10, 360)) : null;

      if (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.CLOSED) {
        const periodsToGenerate = status === SubscriptionStatus.CLOSED ? Math.min(monthsAgo, 4) : Math.max(1, monthsAgo);

        for (let p = 0; p < periodsToGenerate; p++) {
          invoiceCounter++;
          const periodStart = subMonths(now, periodsToGenerate - p);
          const periodEnd = subDays(addDays(periodStart, 30), 1);
          const issueDate = periodStart;
          const dueDate = addDays(issueDate, 15);

          const subtotal = unitPrice * qty;
          const taxAmt = Math.round((subtotal * tax.rateBps) / 10000);
          const invTotal = subtotal + taxAmt;
          const invId = `inv-det-${invoiceCounter}`;
          const invNum = `INV-2025-${String(invoiceCounter).padStart(6, "0")}`;

          // Status of historical invoice
          let invStatus: InvoiceStatus = InvoiceStatus.PAID;
          let paidTotal = invTotal;

          const invRoll = rng();
          // Keep DRAFT invoices recent only (last 7 days)
          if (p === periodsToGenerate - 1 && invRoll < 0.10 && dueDate >= subDays(now, 7)) {
            invStatus = InvoiceStatus.DRAFT;
            paidTotal = 0;
          } else if (invRoll < 0.15) {
            // Overdue or partially paid
            invStatus = InvoiceStatus.CONFIRMED;
            if (invRoll < 0.08) {
              // Fully unpaid overdue
              paidTotal = 0;
              if (dueDate < now) {
                // Seed dunning reminders based on days late
                const daysLate = Math.max(1, Math.round((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24)));
                if (daysLate >= 1) reminderBatch.push({ id: `dr-${invId}-1`, invoiceId: invId, stage: 1, sentAt: addDays(dueDate, 1) });
                if (daysLate >= 3) reminderBatch.push({ id: `dr-${invId}-3`, invoiceId: invId, stage: 3, sentAt: addDays(dueDate, 3) });
                if (daysLate >= 7) reminderBatch.push({ id: `dr-${invId}-7`, invoiceId: invId, stage: 7, sentAt: addDays(dueDate, 7) });
              }
            } else {
              // Partially paid
              paidTotal = Math.round(invTotal * 0.5);
              paymentBatch.push({
                id: `pay-${invId}-1`,
                invoiceId: invId,
                method: randomPick(["CASH", "BANK_TRANSFER", "CARD", "UPI", "CHEQUE"]),
                amount: paidTotal,
                paidOn: addDays(issueDate, 3),
                note: "Partial payment",
              });
            }
          } else {
            // Fully paid
            invStatus = InvoiceStatus.PAID;
            paidTotal = invTotal;
            paymentBatch.push({
              id: `pay-${invId}-1`,
              invoiceId: invId,
              method: randomPick(["CASH", "BANK_TRANSFER", "CARD", "UPI", "CHEQUE"]),
              amount: paidTotal,
              paidOn: addDays(issueDate, 2),
              note: "Automated settlement",
            });
          }

          invoiceBatch.push({
            id: invId,
            number: invNum,
            subscriptionId: subId,
            customerId: cust.id,
            status: invStatus,
            issueDate,
            dueDate,
            periodStart,
            periodEnd,
            subtotal,
            discountTotal: 0,
            taxTotal: taxAmt,
            total: invTotal,
            paidTotal,
            createdAt: issueDate,
            updatedAt: issueDate,
          });

          invoiceLineBatch.push({
            id: `inl-${invId}-1`,
            invoiceId: invId,
            description: `${prod.name} ${variant ? `(${variant.value})` : ""}`,
            quantity: qty,
            unitPrice,
            lineSubtotal: subtotal,
            discountAmount: 0,
            taxAmount: taxAmt,
            amount: invTotal,
          });

          nextInvoiceDate = addDays(periodEnd, 1);
        }
      }

      // Requirement 1: set nextInvoiceDate on every ACTIVE subscription to next unbilled period (last invoice periodEnd + 1)
      if (status === SubscriptionStatus.ACTIVE) {
        if (!nextInvoiceDate || nextInvoiceDate <= now) {
          nextInvoiceDate = addDays(now, randomInt(5, 25)); // Future unbilled date
        }
      }

      subBatch.push({
        id: subId,
        number: subNum,
        customerId: cust.id,
        planId: plan.id,
        status,
        startDate,
        nextInvoiceDate: status === SubscriptionStatus.ACTIVE ? nextInvoiceDate : null,
        expiryDate: status === SubscriptionStatus.CLOSED ? closedAtDate : null,
        closedAt: status === SubscriptionStatus.CLOSED ? closedAtDate : null,
        paymentTermsDays: 15,
        isPaused,
        createdAt: startDate,
        updatedAt: closedAtDate ?? startDate,
      });

      // Requirement 5: Seed synthetic expansion/contraction ActivityLog entries across past 12 months
      if (i % 20 === 0) {
        const logDate = subMonths(now, randomInt(1, 11));
        const isExp = i % 40 === 0;
        activityBatch.push({
          id: `act-${i}`,
          entity: "subscription",
          entityId: subId,
          action: isExp ? "PLAN_CHANGED" : "QUANTITY_CHANGED",
          detail: isExp ? "+₹500.00 expansion upgrade to higher tier" : "-₹250.00 contraction license reduction",
          actorId: null,
          at: logDate,
        });
      }
    }

    // Execute bulk batch insertions in 500-item chunks for lightning performance
    console.log(`  → Batch inserting ${subBatch.length} subscriptions...`);
    for (let c = 0; c < subBatch.length; c += 500) {
      await prisma.subscription.createMany({ data: subBatch.slice(c, c + 500) });
    }

    console.log(`  → Batch inserting ${subLineBatch.length} subscription lines...`);
    for (let c = 0; c < subLineBatch.length; c += 500) {
      await prisma.subscriptionLine.createMany({ data: subLineBatch.slice(c, c + 500) });
    }

    console.log(`  → Batch inserting ${invoiceBatch.length} invoices...`);
    for (let c = 0; c < invoiceBatch.length; c += 500) {
      await prisma.invoice.createMany({ data: invoiceBatch.slice(c, c + 500) });
    }

    console.log(`  → Batch inserting ${invoiceLineBatch.length} invoice lines...`);
    for (let c = 0; c < invoiceLineBatch.length; c += 500) {
      await prisma.invoiceLine.createMany({ data: invoiceLineBatch.slice(c, c + 500) });
    }

    console.log(`  → Batch inserting ${paymentBatch.length} payments...`);
    for (let c = 0; c < paymentBatch.length; c += 500) {
      await prisma.payment.createMany({ data: paymentBatch.slice(c, c + 500) });
    }

    if (reminderBatch.length > 0) {
      console.log(`  → Batch inserting ${reminderBatch.length} dunning reminders...`);
      for (let c = 0; c < reminderBatch.length; c += 500) {
        await prisma.dunningReminder.createMany({ data: reminderBatch.slice(c, c + 500) });
      }
    }

    if (activityBatch.length > 0) {
      console.log(`  → Batch inserting ${activityBatch.length} activity log entries...`);
      await prisma.activityLog.createMany({ data: activityBatch });
    }

    // Synchronize Counter table
    await prisma.counter.upsert({
      where: { key: "SUB-2025" },
      update: { value: subCounter },
      create: { key: "SUB-2025", value: subCounter },
    });
    await prisma.counter.upsert({
      where: { key: "INV-2025" },
      update: { value: invoiceCounter },
      create: { key: "INV-2025", value: invoiceCounter },
    });

    // 9. Requirement 1: Seed verification step!
    // Run billingService.runBatch({ asOf: today() }) and assert 0 failures, 0 unique errors, small number created
    console.log("  → Running Seed Consistency Verification...");
    const verificationBatch = await billingService.runBatch({ asOf: today(), batchSize: 50 });
    console.log("  ✓ Billing Run Verification Result:", {
      created: verificationBatch.batchSummary.created,
      alreadyBilled: verificationBatch.batchSummary.alreadyBilled,
      skippedPaused: verificationBatch.batchSummary.skippedPaused,
      skippedInProgress: verificationBatch.batchSummary.skippedInProgress,
      failed: verificationBatch.batchSummary.failed.length,
    });

  if (verificationBatch.batchSummary.failed.length > 0) {
    throw new Error(`Seed verification failed: billing run had ${verificationBatch.batchSummary.failed.length} failures!`);
  }

  const finalSubCount = await prisma.subscription.count();
  const finalInvCount = await prisma.invoice.count();
  const finalPayCount = await prisma.payment.count();
  const elapsedSec = ((performance.now() - seedStart) / 1000).toFixed(1);

  console.log(`✅ Deterministic seed completed successfully in ${elapsedSec}s!`);
  console.log(`   • Total Subscriptions: ${finalSubCount.toLocaleString()}`);
  console.log(`   • Total Invoices:      ${finalInvCount.toLocaleString()}`);
  console.log(`   • Total Payments:      ${finalPayCount.toLocaleString()}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
