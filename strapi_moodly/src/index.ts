import type { Core } from '@strapi/strapi';

type RoleSeed = {
  name: string;
  type: string;
  description: string;
};

type CategorySeed = {
  name: string;
  description: string;
  categoryType: 'personal' | 'professional' | 'wellbeing' | 'other';
  icon?: string;
  order: number;
};

const roleSeeds: RoleSeed[] = [
  {
    name: 'Employee',
    type: 'employee',
    description: 'Default role for employees logging their mood entries.',
  },
  {
    name: 'Manager',
    type: 'manager',
    description: 'Managers supervising one or more teams.',
  },
  {
    name: 'HR',
    type: 'hr',
    description: 'Human resources team overseeing company wellbeing.',
  },
];

const categorySeeds: CategorySeed[] = [
  {
    name: 'Charge de travail',
    description: 'Perception de la charge ou du stress liés au travail.',
    categoryType: 'professional',
    icon: '💼',
    order: 1,
  },
  {
    name: 'Reconnaissance',
    description: 'Feedback positif, récompenses ou manque de reconnaissance.',
    categoryType: 'professional',
    icon: '🏆',
    order: 2,
  },
  {
    name: 'Relations équipe',
    description: 'Interactions sociales et esprit d’équipe.',
    categoryType: 'wellbeing',
    icon: '🤝',
    order: 3,
  },
  {
    name: 'Santé personnelle',
    description: 'État physique ou mental impactant la journée.',
    categoryType: 'personal',
    icon: '🫶',
    order: 4,
  },
  {
    name: 'Vie personnelle',
    description: 'Événements personnels ayant un impact émotionnel.',
    categoryType: 'personal',
    icon: '🏡',
    order: 5,
  },
  {
    name: 'Autre',
    description: 'Autre raison ou contexte spécifique.',
    categoryType: 'other',
    icon: '✨',
    order: 99,
  },
];

const ensureRoles = async (strapi: Core.Strapi) => {
  for (const role of roleSeeds) {
    const existingRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: role.type } });

    if (!existingRole) {
      await strapi.db.query('plugin::users-permissions.role').create({
        data: role,
      });
      strapi.log.info(`Created users-permissions role "${role.name}" (${role.type}).`);
    }
  }
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const ensureDefaultCategories = async (strapi: Core.Strapi) => {
  for (const category of categorySeeds) {
    const existingCategory = await strapi.entityService.findMany(
      'api::mood-category.mood-category',
      {
        filters: { name: category.name },
        limit: 1,
      }
    );

    if (!existingCategory || existingCategory.length === 0) {
      await strapi.entityService.create('api::mood-category.mood-category', {
        data: { ...category, slug: slugify(category.name), isDefault: true },
      });
      strapi.log.info(`Seeded mood category "${category.name}".`);
    }
  }
};

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureRoles(strapi);
    await ensureDefaultCategories(strapi);
  },
};
