export default ({ env }) => ({
  'users-permissions': {
    enabled: true,
    config: {
      jwtSecret: env('JWT_SECRET'),
      defaultRole: 'employee',
    },
  },
});
