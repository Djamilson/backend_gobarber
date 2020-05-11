const bcrypt = require('bcryptjs');

module.exports = {
  up: QueryInterface => {
    return QueryInterface.bulkInsert(
      'users',
      [
        {
          name: 'Djamilson Alves da Costa',
          email: 'djamilson@gmail.com',
          password_hash: bcrypt.hashSync('@123456', 8),
          provider: true,
          is_verified: true,
          status: true,
          admin_master: true,
          created_at: new Date(),
          updated_at: new Date(),
          avatar_id: null,
          company_id: null,
          privacy: true,
          last_login_at: new Date(),
        },
      ],
      {}
    );
  },

  down: () => {},
};
