import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 10; // User requirement 4: cost 10

async function main() {
  console.log("🌱 Starting Brightloop Billing database seed...");

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

    const record = await prisma.user.upsert({
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

    console.log(`  ✓ Demo User [${record.role}]: ${record.email}`);
  }

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
