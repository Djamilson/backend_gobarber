import User from '../models/User';
import GroupUser from '../models/GroupUser';
import Group from '../models/Group';

class CompanyUserController {
  async index(req, res) {
    const { id } = req.params;

    const listUser = await User.findAll({
      where: { company_id: id },
      attributes: ['id', 'name', 'status', 'company_id', 'admin_master'],
      include: [
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

    return res.json(listUser);
  }

  async update(req, res) {
    const { id } = req.params;

    const userExists = await User.findByPk(id, {
      include: [
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

    if (!userExists) {
      return res.status(400).json({ error: 'Not user exists.' });
    }

    if (userExists.admin_master) {
      return res.status(401).json({
        error:
          'Esse usuário não pode ser desabilitado, pois é o usuário Master do Sistema!',
      });
    }

    const status = !userExists.status;
    await userExists.update({ status });

    return res.status(200).json({
      success: 'Usuário alterado com sucesso!',
    });
  }
}

export default new CompanyUserController();
