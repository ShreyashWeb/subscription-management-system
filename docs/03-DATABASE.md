# 03: Database

PostgreSQL + Prisma. Money is **integer minor units** (paise/cents). Calendar dates use `@db.Date`.

## 1. Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  STAFF
  CUSTOMER
}

enum BillingPeriod {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

enum SubscriptionStatus {
  DRAFT
  QUOTATION
  CONFIRMED
  ACTIVE
  CLOSED
}

enum InvoiceStatus {
  DRAFT
  CONFIRMED
  PAID
  CANCELLED
}

enum DiscountType {
  FIXED
  PERCENT
}

enum DiscountScope {
  PRODUCT
  SUBSCRIPTION
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique            // store lowercased
  name         String
  passwordHash String
  role         Role     @default(CUSTOMER)
  phone        String?
  company      String?
  address      String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  subscriptions Subscription[]
  invoices      Invoice[]
  resets        PasswordReset[]
  activities    ActivityLog[]

  @@index([role])
}

model PasswordReset {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Product {
  id         String   @id @default(cuid())
  name       String
  type       String                     // e.g. "Software", "Add-on", "Service"
  salesPrice Int                        // minor units
  costPrice  Int                        // minor units
  notes      String?
  active     Boolean  @default(true)
  createdAt  DateTime @default(now())

  variants ProductVariant[]
  subLines SubscriptionLine[]
  tplLines TemplateLine[]

  @@index([active])
  @@index([name])
}

model ProductVariant {
  id         String  @id @default(cuid())
  productId  String
  attribute  String                      // e.g. "Brand"
  value      String                      // e.g. "Odoo"
  extraPrice Int     @default(0)         // e.g. 56000 for +560.00
  product    Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  subLines SubscriptionLine[]
  tplLines TemplateLine[]

  @@unique([productId, attribute, value])
}

model Tax {
  id      String  @id @default(cuid())
  name    String
  rateBps Int                             // basis points: 1800 = 18.00%
  active  Boolean @default(true)

  subLines SubscriptionLine[]
}

model Plan {
  id            String        @id @default(cuid())
  name          String
  price         Int                       // minor units per period
  period        BillingPeriod
  minQty        Int           @default(1)
  availableFrom DateTime      @db.Date
  availableTo   DateTime?     @db.Date
  autoClose     Boolean       @default(false)
  closable      Boolean       @default(true)
  pausable      Boolean       @default(false)
  renewable     Boolean       @default(true)
  trialDays     Int           @default(0)
  active        Boolean       @default(true)
  createdAt     DateTime      @default(now())

  subscriptions Subscription[]
  templates     QuotationTemplate[]

  @@index([active, availableFrom, availableTo])
}

model QuotationTemplate {
  id           String   @id @default(cuid())
  name         String
  planId       String
  validityDays Int
  createdAt    DateTime @default(now())
  plan         Plan     @relation(fields: [planId], references: [id])
  lines        TemplateLine[]
}

model TemplateLine {
  id         String  @id @default(cuid())
  templateId String
  productId  String
  variantId  String?
  quantity   Int     @default(1)
  template   QuotationTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  product    Product           @relation(fields: [productId], references: [id])
  variant    ProductVariant?   @relation(fields: [variantId], references: [id])
}

model Subscription {
  id               String             @id @default(cuid())
  number           String             @unique       // SUB-2026-00042
  customerId       String
  planId           String
  status           SubscriptionStatus @default(DRAFT)
  startDate        DateTime           @db.Date
  expiryDate       DateTime?          @db.Date
  paymentTermsDays Int                @default(15)
  nextInvoiceDate  DateTime?          @db.Date      // null until Active
  quotationValidUntil DateTime?       @db.Date
  isPaused         Boolean            @default(false)
  pausedAt         DateTime?
  closedAt         DateTime?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  customer User   @relation(fields: [customerId], references: [id])
  plan     Plan   @relation(fields: [planId], references: [id])
  lines    SubscriptionLine[]
  invoices Invoice[]

  @@index([status])
  @@index([customerId])
  @@index([planId])
  @@index([status, isPaused, nextInvoiceDate])      // billing run query
  @@index([createdAt])
}

model SubscriptionLine {
  id             String  @id @default(cuid())
  subscriptionId String
  productId      String
  variantId      String?
  taxId          String?
  quantity       Int
  unitPrice      Int                                // base + variant extra, minor units
  subscription   Subscription    @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  product        Product         @relation(fields: [productId], references: [id])
  variant        ProductVariant? @relation(fields: [variantId], references: [id])
  tax            Tax?            @relation(fields: [taxId], references: [id])

  @@index([subscriptionId])
}

model Discount {
  id          String        @id @default(cuid())
  name        String
  type        DiscountType
  value       Int                                   // FIXED: minor units. PERCENT: basis points (1000 = 10%)
  minPurchase Int           @default(0)             // minor units
  minQty      Int           @default(0)
  startDate   DateTime      @db.Date
  endDate     DateTime?     @db.Date
  usageLimit  Int?                                  // null = unlimited
  usedCount   Int           @default(0)
  scope       DiscountScope
  active      Boolean       @default(true)
  createdAt   DateTime      @default(now())

  targets DiscountTarget[]
  invoiceLines InvoiceLine[]

  @@index([active, startDate, endDate])
}

// For PRODUCT scope: list of products. For SUBSCRIPTION scope: list of subscriptions.
model DiscountTarget {
  id             String  @id @default(cuid())
  discountId     String
  productId      String?
  subscriptionId String?
  discount       Discount @relation(fields: [discountId], references: [id], onDelete: Cascade)

  @@index([discountId])
  @@index([productId])
  @@index([subscriptionId])
}

model Invoice {
  id             String        @id @default(cuid())
  number         String        @unique               // INV-2026-000123
  subscriptionId String
  customerId     String
  status         InvoiceStatus @default(DRAFT)
  issueDate      DateTime      @db.Date
  dueDate        DateTime      @db.Date
  periodStart    DateTime      @db.Date
  periodEnd      DateTime      @db.Date
  subtotal       Int
  discountTotal  Int           @default(0)
  taxTotal       Int
  total          Int
  paidTotal      Int           @default(0)            // denormalized, kept in sync by paymentsService
  sentAt         DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  subscription Subscription @relation(fields: [subscriptionId], references: [id])
  customer     User         @relation(fields: [customerId], references: [id])
  lines        InvoiceLine[]
  payments     Payment[]
  reminders    DunningReminder[]

  @@unique([subscriptionId, periodStart])             // ← prevents double billing
  @@index([status, dueDate])                          // overdue queries
  @@index([customerId, status])
  @@index([issueDate])
  @@index([subscriptionId])
}

model InvoiceLine {
  id          String   @id @default(cuid())
  invoiceId   String
  description String
  quantity    Int
  unitPrice   Int
  lineSubtotal Int                                    // quantity * unitPrice
  discountAmount Int   @default(0)
  discountId  String?
  taxAmount   Int      @default(0)
  amount      Int                                     // lineSubtotal - discount + tax
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  discount    Discount? @relation(fields: [discountId], references: [id])

  @@index([invoiceId])
}

model Payment {
  id        String   @id @default(cuid())
  invoiceId String
  method    String                                    // CASH | BANK_TRANSFER | CARD | UPI | CHEQUE
  amount    Int
  paidOn    DateTime @db.Date
  note      String?
  createdById String?
  createdAt DateTime @default(now())
  invoice   Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
  @@index([paidOn])
}

model DunningReminder {
  id        String   @id @default(cuid())
  invoiceId String
  stage     Int                                       // 1, 3, 7 (days after due)
  sentAt    DateTime @default(now())
  invoice   Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@unique([invoiceId, stage])                        // idempotent reminders
}

model Counter {
  key   String @id                                    // e.g. "SUB-2026", "INV-2026"
  value Int    @default(0)
}

model ActivityLog {
  id         String   @id @default(cuid())
  entity     String                                   // "subscription" | "invoice" | ...
  entityId   String
  action     String
  detail     String?
  actorId    String?
  at         DateTime @default(now())
  actor      User?    @relation(fields: [actorId], references: [id])

  @@index([entity, entityId])
  @@index([at])
}
```

## 2. Why these constraints matter

| Constraint | Protects against |
|---|---|
| `User.email @unique` (store lowercase) | Duplicate accounts |
| `Invoice @@unique([subscriptionId, periodStart])` | **Double billing** |
| `DunningReminder @@unique([invoiceId, stage])` | Duplicate reminders |
| `PasswordReset.tokenHash @unique` + `usedAt` | Token reuse |
| `Counter` row updated with `UPDATE ... RETURNING` | Duplicate subscription / invoice numbers |
| Index `(status, isPaused, nextInvoiceDate)` on Subscription | Slow billing-run selection |
| Index `(status, dueDate)` on Invoice | Slow overdue list and dashboard |

## 3. Numbering

Use the `Counter` table inside the same transaction as the insert:

```sql
INSERT INTO "Counter" (key, value) VALUES ('INV-2026', 1)
ON CONFLICT (key) DO UPDATE SET value = "Counter".value + 1
RETURNING value;
```

Format: `INV-2026-000123`, `SUB-2026-00042`.

## 4. Derived values (never stored twice without a sync rule)

- `Invoice.paidTotal` is updated in the same transaction as every payment insert/delete. Outstanding = `total - paidTotal`.
- If you ever doubt it, `SUM(payments.amount)` is the truth. A repair script can recompute.

## 5. Seed plan (`prisma/seed.ts`)

Create, in this order:

1. Users: admin, staff, one demo customer (see README logins), plus ~300 customers.
2. Taxes: GST 5%, GST 18%, Zero-rated.
3. Products: ~12 (software, add-ons, services) with variants, including **Brand = Odoo (+560)**.
4. Plans: monthly, yearly, weekly, daily examples; mix of pausable / closable / auto-close.
5. Quotation templates: 3.
6. **~2,000 subscriptions** in mixed statuses (about 60% Active), start dates spread over the past 18 months, with lines.
7. Invoices: backfill by running the billing service with `asOf` stepped month by month (this also tests idempotency). Result: 6,000+ invoices.
8. Payments: pay about 70% of confirmed invoices fully, 10% partially; leave about 8% overdue.
9. Discounts: 4 (percent and fixed, one nearly exhausted, one expired).

The seed must be re-runnable (truncate first or check for existing data).
