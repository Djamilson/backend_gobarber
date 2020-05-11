import Sequelize, { Model } from 'sequelize';

const crypto = require('crypto');

class Company extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        status: Sequelize.BOOLEAN,
        cod_company: Sequelize.STRING,
      },
      { sequelize }
    );

    this.addHook('beforeSave', async company => {
      company.cod_company = await crypto.randomBytes(3).toString('hex');
    });

    return this;
  }

  static associate(models) {
    this.hasMany(models.User, {
      foreignKey: 'company_id',
      as: 'users',
    });
    this.belongsTo(models.File, { foreignKey: 'logo_id', as: 'logo' });
  }
}

export default Company;
