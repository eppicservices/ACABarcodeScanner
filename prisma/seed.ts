import { PrismaClient, SchoolLevel, AdminRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default app settings if not exists
  const existingSettings = await prisma.appSettings.findUnique({
    where: { id: 1 },
  })

  if (!existingSettings) {
    await prisma.appSettings.create({
      data: {
        id: 1,
        schoolName: 'Aldersgate Christian Academy',
        schoolYear: '2024-2025',
      },
    })
    console.log('Created default app settings')
  }

  // Create test parents
  const parent1 = await prisma.parent.upsert({
    where: { email: 'john.smith@email.com' },
    update: {},
    create: {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '555-0101',
      isActive: true,
    },
  })

  const parent2 = await prisma.parent.upsert({
    where: { email: 'sarah.j@email.com' },
    update: {},
    create: {
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '555-0102',
      isActive: true,
    },
  })

  const parent3 = await prisma.parent.upsert({
    where: { email: 'mike.w@email.com' },
    update: {},
    create: {
      name: 'Mike Williams',
      email: 'mike.w@email.com',
      phone: '555-0103',
      isActive: true,
    },
  })

  console.log('Created test parents')

  // Create test students
  const students = [
    { parentId: parent1.id, name: 'Emma Smith', barcode: '1001', balance: 25, schoolLevel: SchoolLevel.elementary },
    { parentId: parent1.id, name: 'Liam Smith', barcode: '1002', balance: 12, schoolLevel: SchoolLevel.high_school },
    { parentId: parent2.id, name: 'Olivia Johnson', barcode: '1003', balance: 8, schoolLevel: SchoolLevel.elementary },
    { parentId: parent2.id, name: 'Noah Johnson', barcode: '1004', balance: 30, schoolLevel: SchoolLevel.high_school },
    { parentId: parent3.id, name: 'Ava Williams', barcode: '1005', balance: 5, schoolLevel: SchoolLevel.elementary },
  ]

  for (const student of students) {
    await prisma.student.upsert({
      where: { barcode: student.barcode },
      update: {},
      create: student,
    })
  }

  console.log('Created test students')

  // Create a default admin user (only if no admin exists)
  const existingAdmin = await prisma.adminUser.findFirst()

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.adminUser.create({
      data: {
        email: 'admin@school.com',
        password: hashedPassword,
        role: AdminRole.super_admin,
      },
    })
    console.log('Created default admin user: admin@school.com / admin123')
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
