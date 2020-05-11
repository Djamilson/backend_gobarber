import * as Yup from 'yup';
import Company from '../models/Company';
import File from '../models/File';
import Group from '../models/Group';
import User from '../models/User';
import Cache from '../../lib/Cache';

class CadCompanyUserController {
  async index(req, res) {
    const { cod_company: cod } = req.params;

    const listUser = await Company.findByPk(cod, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name'],
          where: {
            admin_master: true,
          },
        },
        {
          model: File,
          as: 'logo',
          attributes: ['id', 'path', 'url'],
        },
      ],
      attributes: ['id', 'name', 'email', 'cod_company'],
    });

    return res.json(listUser);
  }

  async store(req, res, next) {
    const { meuErro } = req;

    if (meuErro !== undefined) {
      next();
    }

    const role_user = 'role-administrador';
    const groupExists = await Group.findOne({
      where: { name: role_user },
    });

    if (!groupExists) {
      req.meuErro = res
        .status(402)
        .json({ error: 'Grupos de administrador não existe!' });

      next();
    }

    req.group = groupExists;
    const { name, email, password } = req.dataForm;
    //* * Testa email */

    const userExists = await User.findOne({
      where: { email },
    });

    if (userExists) {
      req.meuErro = res.status(401).json({ error: 'User already exists.' });

      next();
    }

    /** Criar user */

    const { company } = req;

    req.user = await User.create({
      name,
      email,
      company_id: company.id,
      password,
      provider: true,
      admin_master: true,
    });

      /**
     * Invalidate cache
     */

    await Cache.invalidatePrefix(`providers`);


    next();
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      cod_company: Yup.string().min(1),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id, email } = req.body.data;

    const companyExists = await Company.findByPk(id);

    if (email !== companyExists.email) {
      const comparaEmailExists = await Company.findOne({ where: { email } });

      if (comparaEmailExists) {
        return res.status(400).json({ error: 'Email already exists.' });
      }
    }

    const { id: id_company } = await companyExists.update(req.body.data);

    const company = await Company.findByPk(id_company, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name'],
          where: {
            admin_master: true,
          },
        },
        {
          model: File,
          as: 'logo',
          attributes: ['id', 'path', 'url'],
        },
      ],
      attributes: ['id', 'name', 'email', 'cod_company'],
    });

    return res.json(company);
  }
}

export default new CadCompanyUserController();
