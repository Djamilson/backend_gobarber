module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('tokens', 'code_active', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'test',
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('tokens', 'code_active');
  },
};
