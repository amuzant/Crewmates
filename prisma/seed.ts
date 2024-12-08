import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create roles
  const [adminRole, leaderRole, memberRole] = await Promise.all([
    prisma.role.create({
      data: {
        name: 'ADMIN',
        displayName: 'Admin'
      }
    }),
    prisma.role.create({
      data: {
        name: 'TEAM_LEADER',
        displayName: 'Team Leader'
      }
    }),
    prisma.role.create({
      data: {
        name: 'TEAM_MEMBER',
        displayName: 'Team Member'
      }
    })
  ])

  // Create test users
  const hashedPassword = await bcrypt.hash('Password123!', 10)
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        displayName: 'Admin User',
        password: hashedPassword,
        role: { connect: { id: adminRole.id } }
      }
    }),
    prisma.user.create({
      data: {
        email: 'leader@example.com',
        username: 'leader',
        displayName: 'Team Leader',
        password: hashedPassword,
        role: { connect: { id: leaderRole.id } }
      }
    }),
    prisma.user.create({
      data: {
        email: 'member@example.com',
        username: 'member',
        displayName: 'Team Member',
        password: hashedPassword,
        role: { connect: { id: memberRole.id } }
      }
    })
  ])

  // Create sprints
  const sprints = await Promise.all([
    prisma.sprint.create({
      data: {
        name: 'Sprint 1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-14'),
      }
    }),
    prisma.sprint.create({
      data: {
        name: 'Sprint 2',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-28'),
      }
    }),
    prisma.sprint.create({
      data: {
        name: 'Sprint 3',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-14'),
      }
    })
  ])

  // Create projects with leaders
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: 'Project Alpha',
        description: 'Main product development with focus on core features',
        sprint: {
          connect: { id: sprints[0].id }
        },
        leaders: {
          create: [
            { userId: users[0].id } // Admin as leader
          ]
        },
        members: {
          connect: [
            { id: users[0].id },
            { id: users[1].id }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'Project Beta',
        description: 'Client portal redesign and UX improvements',
        sprint: {
          connect: { id: sprints[1].id }
        },
        leaders: {
          create: [
            { userId: users[1].id } // Team leader as leader
          ]
        },
        members: {
          connect: [
            { id: users[1].id },
            { id: users[2].id }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'Mobile App Development',
        description: 'Cross-platform mobile application for existing web service',
        sprint: {
          connect: { id: sprints[2].id }
        },
        leaders: {
          create: [
            { userId: users[0].id }
          ]
        },
        members: {
          connect: [
            { id: users[0].id },
            { id: users[1].id },
            { id: users[2].id }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'API Modernization',
        description: 'Upgrading legacy APIs to modern REST standards',
        sprint: {
          connect: { id: sprints[0].id }
        },
        leaders: {
          create: [
            { userId: users[1].id }
          ]
        },
        members: {
          connect: [
            { id: users[1].id },
            { id: users[2].id }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'Security Audit',
        description: 'Comprehensive security review and implementation',
        sprint: {
          connect: { id: sprints[1].id }
        },
        leaders: {
          create: [
            { userId: users[0].id }
          ]
        },
        members: {
          connect: [
            { id: users[0].id },
            { id: users[2].id }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'Mobile App Development',
        description: 'Cross-platform mobile application for existing web service',
        sprint: {
          connect: { id: sprints[2].id }
        },
        leaders: {
          create: [
            { userId: users[0].id }
          ]
        },
        members: {
          connect: [
            { id: users[0].id },
            { id: users[1].id },
            { id: users[2].id }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'User Analytics Dashboard',
        description: 'Real-time analytics dashboard for user behavior tracking',
        sprint: {
          connect: { id: sprints[2].id }
        },
        leaders: {
          create: [
            { userId: users[1].id }
          ]
        },
        members: {
          connect: [
            { id: users[1].id },
            { id: users[2].id }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'Performance Optimization',
        description: 'System-wide performance improvements and optimizations',
        sprint: {
          connect: { id: sprints[2].id }
        },
        leaders: {
          create: [
            { userId: users[2].id }
          ]
        },
        members: {
          connect: [
            { id: users[0].id },
            { id: users[2].id }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'Authentication Upgrade',
        description: 'Implementing OAuth2 and improving security features',
        sprint: {
          connect: { id: sprints[2].id }
        },
        leaders: {
          create: [
            { userId: users[0].id }
          ]
        },
        members: {
          connect: [
            { id: users[0].id },
            { id: users[1].id }
          ]
        }
      }
    }),
    prisma.project.create({
      data: {
        name: 'Database Migration',
        description: 'Migrating from SQL to NoSQL for better scalability',
        sprint: {
          connect: { id: sprints[2].id }
        },
        leaders: {
          create: [
            { userId: users[1].id }
          ]
        },
        members: {
          connect: [
            { id: users[1].id },
            { id: users[2].id }
          ]
        }
      }
    })
  ])

  // Create sample messages for multiple projects
  await prisma.message.createMany({
    data: [
      // Project Alpha messages
      {
        content: "Welcome to Project Alpha! Let's get started!",
        userId: users[0].id,
        projectId: projects[0].id,
        createdAt: new Date('2024-01-01T10:00:00Z')
      },
      {
        content: "Thanks! I'm excited to work on this project.",
        userId: users[1].id,
        projectId: projects[0].id,
        createdAt: new Date('2024-01-01T10:05:00Z')
      },
      // Mobile App Development messages
      {
        content: "Mobile app development kickoff meeting tomorrow at 10 AM",
        userId: users[0].id,
        projectId: projects[2].id,
        createdAt: new Date('2024-01-02T09:00:00Z')
      },
      {
        content: "I've prepared the initial wireframes for review",
        userId: users[2].id,
        projectId: projects[2].id,
        createdAt: new Date('2024-01-02T11:30:00Z')
      },
      // API Modernization messages
      {
        content: "Starting the API documentation today",
        userId: users[1].id,
        projectId: projects[3].id,
        createdAt: new Date('2024-01-03T08:00:00Z')
      },
      {
        content: "Found some legacy endpoints that need updating",
        userId: users[2].id,
        projectId: projects[3].id,
        createdAt: new Date('2024-01-03T14:20:00Z')
      }
    ]
  })

  // Create badge definitions and assign them to admin user
  const adminUser = await prisma.user.findFirst({
    where: {
      email: 'admin@example.com'
    }
  })

  if (!adminUser) {
    throw new Error('Admin user not found')
  }

  // Create badges with user relationship
  const badges = [
    {
      name: 'Gold Trophy',
      description: 'Awarded for achieving first place in a sprint',
      type: 'GOLD_TROPHY',
      user: {
        connect: {
          id: adminUser.id
        }
      }
    },
    {
      name: 'Silver Trophy',
      description: 'Awarded for achieving second place in a sprint',
      type: 'SILVER_TROPHY',
      user: {
        connect: {
          id: adminUser.id
        }
      }
    },
    {
      name: 'Bronze Trophy',
      description: 'Awarded for achieving third place in a sprint',
      type: 'BRONZE_TROPHY',
      user: {
        connect: {
          id: adminUser.id
        }
      }
    }
  ]

  // Create badges
  for (const badge of badges) {
    await prisma.badge.create({
      data: badge
    })
  }

  // Create sample prizes
  const prizes = await Promise.all([
    prisma.prize.create({
      data: {
        name: "Golden Cup",
        description: "A prestigious trophy awarded to the sprint's winning team",
        photo: "prizes/golden-cup.png"
      }
    }),
    prisma.prize.create({
      data: {
        name: "Team Dinner",
        description: "A fully paid dinner for the winning team at a restaurant of their choice",
        photo: "prizes/team-dinner.png"
      }
    }),
    prisma.prize.create({
      data: {
        name: "Extra Day Off",
        description: "Each member of the winning team gets an extra vacation day",
        photo: "prizes/vacation.png"
      }
    }),
    prisma.prize.create({
      data: {
        name: "Innovation Award",
        description: "A special recognition for the most innovative project solution",
        photo: "prizes/innovation.png"
      }
    }),
    prisma.prize.create({
      data: {
        name: "Tech Gadget Bundle",
        description: "A bundle of latest tech gadgets for each team member",
        photo: "prizes/tech-bundle.png"
      }
    })
  ])

  // Assign prizes to sprints
  await prisma.sprint.update({
    where: { id: sprints[0].id },
    data: {
      hasPrize: true,
      prize: {
        connect: { id: prizes[0].id } // Golden Cup for first sprint
      }
    }
  })

  await prisma.sprint.update({
    where: { id: sprints[1].id },
    data: {
      hasPrize: true,
      prize: {
        connect: { id: prizes[1].id } // Team Dinner for second sprint
      }
    }
  })

  // Award some prizes to users (for completed sprints)
  await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: {
      wonPrizes: {
        connect: [{ id: prizes[0].id }] // Admin won the Golden Cup
      }
    }
  })

  await prisma.user.update({
    where: { email: 'leader@example.com' },
    data: {
      wonPrizes: {
        connect: [{ id: prizes[1].id }] // Leader won the Team Dinner
      }
    }
  })

  console.log('Database seeded!')
  console.log('Seeded prizes and awarded them to users!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 