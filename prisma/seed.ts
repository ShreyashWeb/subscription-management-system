import { PrismaClient, Role, BillingPeriod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10; // User requirement 4: cost 10

async function main() {
  console.log("🌱 Starting Brightloop Billing database seed...");

  // 1. Seed Demo Users
  const demoUsers = [
    {
      name: "Brightloop Admin",
      email: "admin@brightloop.test",
      password: "Admin@12345",
      role: Role.ADMIN,
      company: "Brightloop Software Inc.",
    },
    {
      name: "Operations Staff",
      email: "staff@brightloop.test",
      password: "Staff@12345",
      role: Role.STAFF,
      company: "Brightloop Operations",
    },
    {
      name: "Acme Enterprise Customer",
      email: "customer@brightloop.test",
      password: "Customer@12345",
      role: Role.CUSTOMER,
      company: "Acme Corp Ltd.",
    },
  ];

  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
        company: user.company,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
        company: user.company,
      },
    });
  }
  console.log("  ✓ Seeded demo users (Admin, Staff, Customer)");

  // 2. Seed Tax Rules (Basis Points)
  const taxRules = [
    { name: "GST 18%", rateBps: 1800, active: true },
    { name: "GST 12%", rateBps: 1200, active: true },
    { name: "GST 5%", rateBps: 500, active: true },
    { name: "Tax Exempt (0%)", rateBps: 0, active: true },
  ];

  for (const tax of taxRules) {
    const existing = await prisma.tax.findFirst({ where: { name: tax.name } });
    if (!existing) {
      await prisma.tax.create({ data: tax });
    }
  }
  console.log("  ✓ Seeded tax rules (GST 18%, 12%, 5%, 0%)");

  // 3. Seed Products and Variants (including Odoo +560 variant)
  const products = [
    {
      name: "Cloud ERP Core License",
      type: "Software",
      salesPrice: 100000, // ₹1,000.00 base price
      costPrice: 40000,   // ₹400.00 cost price -> Margin ₹600.00 (60%)
      notes: "Base core license required for all ERP modules.",
      active: true,
      variants: [
        { attribute: "Brand", value: "Odoo", extraPrice: 56000 }, // +₹560.00 -> Effective ₹1,560.00
        { attribute: "Brand", value: "Standard", extraPrice: 0 },
        { attribute: "Deployment", value: "Dedicated Cloud", extraPrice: 200000 }, // +₹2,000.00
      ],
    },
    {
      name: "Advanced Financial Analytics",
      type: "Add-on",
      salesPrice: 250000, // ₹2,500.00
      costPrice: 50000,   // ₹500.00 -> Margin ₹2,000.00 (80%)
      notes: "Cashflow forecasting, multidimensional reports, and invoice aging.",
      active: true,
      variants: [
        { attribute: "Tier", value: "Pro", extraPrice: 50000 },
        { attribute: "Tier", value: "Enterprise", extraPrice: 150000 },
      ],
    },
    {
      name: "24/7 Priority Support SLA",
      type: "Service",
      salesPrice: 500000, // ₹5,000.00
      costPrice: 150000,  // ₹1,500.00 -> Margin ₹3,500.00 (70%)
      notes: "15-minute response time guarantee and dedicated technical account manager.",
      active: true,
      variants: [],
    },
  ];

  for (const p of products) {
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
          active: p.active,
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
  console.log("  ✓ Seeded commercial products and Odoo (+560) variant");

  // 4. Seed Subscription Plans (Covering DAILY, WEEKLY, MONTHLY, YEARLY + User change 6)
  const plans = [
    {
      name: "Daily Developer Sandbox",
      price: 20000, // ₹200.00 / day
      period: BillingPeriod.DAILY,
      minQty: 1,
      availableFrom: new Date("2025-01-01"),
      availableTo: null,
      autoClose: false,
      closable: true,
      pausable: false,
      renewable: true,
      trialDays: 0,
      active: true,
    },
    {
      name: "Weekly Growth Sprint",
      price: 150000, // ₹1,500.00 / week
      period: BillingPeriod.WEEKLY,
      minQty: 1,
      availableFrom: new Date("2025-01-01"),
      availableTo: null,
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      trialDays: 3,
      active: true,
    },
    {
      name: "Professional Monthly",
      price: 485000, // ₹4,850.00 / month
      period: BillingPeriod.MONTHLY,
      minQty: 1,
      availableFrom: new Date("2025-01-01"),
      availableTo: null,
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      trialDays: 14,
      active: true,
    },
    {
      name: "Enterprise Annual Plan",
      price: 4800000, // ₹48,000.00 / year
      period: BillingPeriod.YEARLY,
      minQty: 5,
      availableFrom: new Date("2025-01-01"),
      availableTo: null,
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      trialDays: 30,
      active: true,
    },
    // User change 6: Plan 1 with autoClose=true and closable=false
    {
      name: "Fixed-Term Pilot (Non-Closable)",
      price: 350000, // ₹3,500.00 / month
      period: BillingPeriod.MONTHLY,
      minQty: 1,
      availableFrom: new Date("2025-01-01"),
      availableTo: new Date("2026-12-31"),
      autoClose: true,
      closable: false,
      pausable: false,
      renewable: false,
      trialDays: 0,
      active: true,
    },
    // User change 6: Plan 2 with availableFrom in the future ("Upcoming")
    {
      name: "Upcoming Visionary 2027",
      price: 6000000, // ₹60,000.00 / year
      period: BillingPeriod.YEARLY,
      minQty: 10,
      availableFrom: new Date("2027-01-01"),
      availableTo: new Date("2028-12-31"),
      autoClose: false,
      closable: true,
      pausable: true,
      renewable: true,
      trialDays: 30,
      active: true,
    },
    // Expired Availability Window Plan (for testing out-of-window flagging)
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

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await prisma.plan.create({ data: plan });
    }
  }
  console.log("  ✓ Seeded plans across all periods (DAILY, WEEKLY, MONTHLY, YEARLY)");

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
