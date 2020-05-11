import mongoose from 'mongoose';
import Appointment from '../app/models/Appointment';
import Horario from '../app/models/Horario';
import Token from '../app/models/Token';
import Company from '../app/models/Company';
import File from '../app/models/File';

import GroupUser from '../app/models/GroupUser';
import Finance from '../app/models/Finance';
import Group from '../app/models/Group';
import User from '../app/models/User';
import databaseConfig from '../config/database';
import Sequelize from 'sequelize';

const models = [
  User,
  File,
  Appointment,
  Horario,
  Token,
  Company,
  Group,
  GroupUser,
  Finance,
];

class Database {
  constructor() {
    this.connection = new Sequelize(databaseConfig);

    this.init();
    this.associate();
    this.mongo();
  }

  init() {
    models.map(model => model.init(this.connection));
  }

  associate() {
    models.forEach(model => {
      if (model.associate) {
        model.associate(this.connection.models);
      }
    });
  }

  mongo() {
    const { MONGO_HOST, MONGO_PORT, MONGO_NAME } = process.env;

    const mongoURI = `mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_NAME}`;

    this.mongoConnection = mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useFindAndModify: true,

      useCreateIndex: true,
      useUnifiedTopology: true,
    });
  }
}

export default new Database();
