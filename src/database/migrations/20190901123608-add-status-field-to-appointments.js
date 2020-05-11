module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('appointments', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'AGUARDANDO',
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('appointments', 'status');
  },
};
