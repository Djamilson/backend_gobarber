import Sequelize, { Model } from 'sequelize';

class Finances extends Model {
  static init(sequelize) {
    super.init(
      {
        date: Sequelize.DATE,
        price: Sequelize.FLOAT,
      },
      { sequelize }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.File, { foreignKey: 'avatar_id', as: 'avatar' });
    this.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
  }
}

export default Finances;
