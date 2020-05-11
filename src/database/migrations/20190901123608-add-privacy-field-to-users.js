module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'privacy', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('users', 'privacy');
  },
};
