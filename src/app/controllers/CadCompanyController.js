import * as Yup from 'yup';

import Company from '../models/Company';
import File from '../models/File';

class CadCompanyController {
  async index(req, res) {
    const company = await Company.findAll({
      where: {
        status: true,
      },
      include: [
        {
          model: File,
          as: 'logo',
          attributes: ['id', 'path', 'url'],
        },
      ],

      attributes: ['id', 'name'],
      order: ['name'],
    });

    return res.json(company);
  }

  async store(req, res, next) {
    const schema = Yup.object().shape({
      name_company: Yup.string().required('O nome da empresa é obrigatório'),
      name: Yup.string().required('O nome do adminstrador é obrigatório'),
      email: Yup.string()
        .email('Insira um e-mail válido')
        .required('O e-mail do administrador é obrigatório'),
      password: Yup.string()
        .min(1, 'No mínimo 1 caracter')
        .required('A senha é obrigatória'),
    });

    const { data } = req.body;

    if (!(await schema.isValid(data))) {
      req.meuErro = res.status(400).json({ error: 'Validation fails' });
      next();
    }
    // o email da company é igual o email do admin
    const { name_company, email } = data;

    /** Criar company */
    const companyExists = await Company.findOne({
      where: { email },
    });

    if (companyExists) {
      req.meuErro = res.status(401).json({ error: 'Company already exists.' });
      next();
    }

    const company = await Company.create({
      name: name_company,
      email,
    });

    req.company = company;
    req.dataForm = data;

    next();
  }
}

export default new CadCompanyController();
