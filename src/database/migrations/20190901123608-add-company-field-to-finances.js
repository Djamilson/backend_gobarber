module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('finances', 'company_id', {
      type: Sequelize.INTEGER,
      references: { model: 'companies', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('finances', 'company_id');
  },
};
