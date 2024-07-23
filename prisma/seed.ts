import { Category, Post, PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

console.log("Running post seed...");

const prisma = new PrismaClient();

console.log("Clearing existing posts...");

// Delete all existing posts and categories
await prisma.category.deleteMany();
await prisma.post.deleteMany();

console.log("Deleted all existing posts.");

const AMOUNT = 400;

const categories: Category[] = [
  {
    id: faker.string.uuid(),
    index: 0,
    name: "Photo Editing",
    icon: "ImageRegular",
  },
  {
    id: faker.string.uuid(),
    index: 1,
    name: "Video Editing",
    icon: "VideoRegular",
  },
  {
    id: faker.string.uuid(),
    index: 2,
    name: "Entertainment",
    icon: "TvRegular",
  },
  { id: faker.string.uuid(), index: 3, name: "Gaming", icon: "GamesRegular" },
  {
    id: faker.string.uuid(),
    index: 4,
    name: "File Editing",
    icon: "DocumentPdfRegular",
  },
  {
    id: faker.string.uuid(),
    index: 5,
    name: "Development",
    icon: "CodeRegular",
  },
  { id: faker.string.uuid(), index: 6, name: "Social", icon: "PeopleRegular" },
  // Add more categories as needed
];

function fakeIntOrNull() {
  const values = [0, 1, 2, null];
  const randomIndex = Math.floor(Math.random() * values.length);
  return values[randomIndex];
}

// Generate posts
const posts = Array.from({ length: AMOUNT }).map(() => {
  const randomCategory = faker.helpers.arrayElement(categories);

  const post: Post = {
    id: faker.string.uuid(),
    categoryId: randomCategory.id,
    title: faker.company.name(),
    description: faker.lorem.paragraph(),
    app_url: null,
    community_url: null,
    user_id: null,
    banner_url: null,
    icon_url: null,
    status_hint: null,
    company: faker.company.name(),
    tags: faker.helpers.uniqueArray(() => faker.lorem.word(), 3),
    // int between 0 and 2, or null
    status: faker.number.int({ min: -1, max: 2 }),
    created_at: faker.date.recent(),
    updated_at: faker.date.recent(),
    update_description: faker.lorem.words({ min: 5, max: 10 }),
  };

  if (
    faker.datatype.boolean({
      probability: 0.8,
    })
  ) {
    post.app_url = faker.internet.url();
  } else {
    post.community_url = faker.internet.url();
  }

  return post;
});

for (const category of categories) {
  await prisma.category.create({
    data: category,
  });
}

for (const post of posts) {
  await prisma.post.create({
    data: post,
  });
}

console.log(`Generated ${categories.length} new categories.`);
console.log(`Generated ${AMOUNT} new posts.`);
