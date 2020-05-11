module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('finances', 'avatar_id', {
      type: Sequelize.INTEGER,
      references: { model: 'files', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      allowNull: true,
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('finances', 'avatar_id');
  },
};
