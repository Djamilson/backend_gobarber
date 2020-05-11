module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('appointments', 'agendar', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('appointments', 'agendar');
  },
};
