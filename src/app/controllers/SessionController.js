import jwt from 'jsonwebtoken';

import User from '../models/User';
import GroupUser from '../models/GroupUser';
import Group from '../models/Group';

import File from '../models/File';

import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
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
              as: 'group',
              attributes: ['id', 'name', 'description'],
            },
          ],
        },
      ],
    });

    // Make sure the user has been verified
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    // Make sure the user has been verified
    if (user && !user.is_verified) {
      return res.status(401).json({
        error:
          'Seu email ainda não foi validado, acesse sua conta de email e confirme a validação do acesso!',
      });
    }

    // Make sure the user has been verified
    if (user && !user.status) {
      return res.status(402).json({
        error:
          'No momento esse usuário está desativado, entre em contato com o administrador!',
      });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(404).json({ error: 'Password does not match' });
    }

    const {
      id,
      name,
      avatar,
      provider,
      is_verified,
      status,
      company_id,
      group_users,
      privacy,
      last_login_at,
    } = user;
    const emailUser = user.email;

    return res.json({
      user: {
        id,
        name,
        email: emailUser,
        avatar,
        provider,
        is_verified,
        status,
        company_id,
        group_users,
        privacy,
        last_login_at,
      },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new SessionController();
