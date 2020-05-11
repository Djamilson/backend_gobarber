import User from '../models/User';
import File from '../models/File';
import Group from '../models/Group';
import GroupUser from '../models/GroupUser';

class UserAvatarController {
  async update(req, res) {
    const userExist = await User.findByPk(req.userId);

    await userExist.update(req.body);

    const user = await User.findByPk(req.userId, {
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

    const {
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
    } = user;

  
    return res.status(200).json({
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
    });
  }
}

export default new UserAvatarController();
