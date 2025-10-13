import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::mood-entry.mood-entry', () => ({
  /**
   * Return mood entries enriched with related data by default.
   */
  async find(ctx) {
    const incomingQuery = ctx.query ?? {};
    const incomingPopulate =
      incomingQuery.populate && typeof incomingQuery.populate === 'object' && !Array.isArray(incomingQuery.populate)
        ? incomingQuery.populate
        : {};

    ctx.query = {
      ...incomingQuery,
      populate: {
        ...incomingPopulate,
        categories: true,
        visibility: true,
        loggedBy: {
          select: ['id', 'username', 'email'],
        },
        team: {
          select: ['id', 'name', 'slug'],
        },
        additionalViewers: {
          select: ['id', 'username', 'email'],
        },
      },
      sort: incomingQuery.sort ?? { loggedAt: 'desc' },
    };

    return await super.find(ctx);
  },
  async create(ctx) {
    const hasAuthenticatedUser = Boolean(ctx.state?.user);
    const isApiTokenRequest = ctx.state?.auth?.strategy === 'api-token';

    if (!hasAuthenticatedUser && !isApiTokenRequest) {
      return ctx.unauthorized('Authentification requise pour enregistrer une humeur.');
    }

    const payload = ctx.request?.body?.data ?? {};
    const data = {
      ...payload,
      loggedAt: payload.loggedAt ?? new Date().toISOString(),
    };

    if (hasAuthenticatedUser) {
      data.loggedBy = ctx.state.user.id;
    } else {
      delete data.loggedBy;
    }

    ctx.request.body = { data };

    return await super.create(ctx);
  },
}));
