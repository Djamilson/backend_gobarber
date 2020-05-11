import * as Yup from 'yup';

import { addDays } from 'date-fns';

import Queue from '../../lib/Queue';
import ActivationContaMailAWS from '../jobs/ActivationContaMailAWS';
import File from '../models/File';
import Group from '../models/Group';
import GroupUser from '../models/GroupUser';
import Token from '../models/Token';
import User from '../models/User';

class CompanyController {
  async index(req, res) {
    const { email } = req.body;

    const user = await User.findOne({
      where: { email },
      attributes: [
        'id',
        'name',
        'email',
        'password_hash',
        'provider',
        'is_verified',
        'status',
        'avatar_id',
        'company_id',
      ],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: GroupUser,
          as: 'group_users',
          attributes: ['id'],
          include: [
            {
              model: Group,
              attributes: ['id', 'name', 'description'],
            },
          ],
        },
      ],
    });

    return res.json(user);
  }

  async store(req, res) {
    const { user, group, meuErro } = req;

    if (meuErro !== undefined) {
      return meuErro;
    }

    await GroupUser.create({
      user_id: user.id,
      group_id: group.id,
    });

    // Create a verification token for this user

    const { code_active } = await Token.create({
      user_id: user.id,
      expires: addDays(new Date(), 1),
    });

    await Queue.add(ActivationContaMailAWS.key, {
      user,
      code_active,
    });

    return res.status(200).json(user);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(1),
      password: Yup.string()
        .min(1)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    await user.update(req.body);

    const { id, name, avatar, status, is_verified } = await User.findByPk(
      req.userId,
      {
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url'],
          },
        ],
      }
    );
    return res.json({
      id,
      name,
      email,
      avatar,
      status,
      is_verified,
    });
  }
}

export default new CompanyController();
