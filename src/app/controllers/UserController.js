import { addDays } from 'date-fns';
import User from '../models/User';
import Token from '../models/Token';
import File from '../models/File';
import Group from '../models/Group';
import GroupUser from '../models/GroupUser';
import Queue from '../../lib/Queue';
import ActivationContaMailAWS from '../jobs/ActivationContaMailAWS';
import Company from '../models/Company';
import Cache from '../../lib/Cache';

import SearchUserService from '../services/SearchUserService';

class UserController {
  async index(req, res) {
    const { id: company_id } = req.params;
    const listUser = await User.findAll({
      where: { company_id },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],

      attributes: ['id', 'name'],
    });

    return res.json(listUser);
  }

  async store(req, res) {
    const { cod_company } = req.body;

    const companyExists = await Company.findOne({
      where: { cod_company },
    });

    if (!companyExists) {
      return res
        .status(403)
        .json({ error: 'Essa empresa não está cadastrada!' });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(401).json({ error: 'User already exists.' });
    }

    const role_user = 'role_usuario';
    const groupExists = await Group.findOne({
      where: { name: role_user },
    });

    if (!groupExists) {
      return res
        .status(402)
        .json({ error: 'Não foi possível encontrar o grupo para associar.' });
    }
    const { name: nam, email: ema, password, privacy: term } = req.body;

    const user = await User.create({
      name: nam,
      email: ema,
      password,
      company_id: companyExists.id,
      provider: true,
      privacy: term,
    });

    await GroupUser.create({
      user_id: user.id,
      group_id: groupExists.id,
    });

    const { id, name, email, provider, is_verified, status, privacy } = user;

    // Create a verification token for this user

    const { code_active } = await Token.create({
      user_id: id,
      expires: addDays(new Date(), 1),
    });

    await Queue.add(ActivationContaMailAWS.key, {
      user,
      code_active,
    });

    if (provider) {
      await Cache.invalidate('providers');
    }

    return res.json({
      id,
      name,
      email,
      is_verified,
      status,
      privacy,
    });
  }

  async update(req, res) {
    const { email, oldPassword } = req.body;
    const { userId } = req;

    const userSearch = await User.findByPk(userId);

    if (email !== userSearch.email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    if (oldPassword && !(await userSearch.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    await userSearch.update(req.body);

    const user = await SearchUserService.run({ userId });
    return res.json(user);
  }
}

export default new UserController();
