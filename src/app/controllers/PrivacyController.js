import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';
import Group from '../models/Group';
import GroupUser from '../models/GroupUser';

class PrivacyController {
  async update(req, res) {
    const schema = Yup.object().shape({
      privacy: Yup.boolean(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const user = await User.findByPk(req.userId);

    await user.update(req.body);

    const {
      id,
      name,
      email: email_,
      avatar,
      status,
      is_verified,

      privacy,

      provider,
      company_id,
      group_users,
    } = await User.findByPk(req.userId, {
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
    return res.json({
      id,
      name,
      email: email_,
      avatar,
      status,
      is_verified,
      privacy,

      provider,
      company_id,
      group_users,
    });
  }
}

export default new PrivacyController();
