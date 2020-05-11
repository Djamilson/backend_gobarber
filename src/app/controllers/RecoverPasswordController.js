import { addDays, isAfter, startOfSecond } from 'date-fns';

import * as Yup from 'yup';
import Queue from '../../lib/Queue';
import ActivationContaMailAWS from '../jobs/ActivationContaMailAWS';

import Token from '../models/Token';
import User from '../models/User';

class RecoverPasswordController {
  async index(req, res) {
    const { token } = req.params;

    const tokenExists = await Token.findOne({ where: { token } });

    // Make sure the user has been verified

    if (!tokenExists) {
      return res.status(400).json({
        error: 'Esse token não existe, gere novo token, em recuperar senha!',
      });
    }

    const hourStart = startOfSecond(new Date(tokenExists.expires));

    if (!isAfter(hourStart, new Date())) {
      return res.status(401).json({
        error: 'Token expirado, gere novo token, em recuperar senha!',
      });
    }

    if (tokenExists.status) {
      return res.status(402).json({
        error: 'Token já foi usado, gere novo token, em recuperar senha!',
      });
    }

    return res.status(200).json();
  }

  async store(req, res) {
    const { email } = req.body;

    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
    });

    if (await schema.isValid(email)) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const userExists = await User.findOne({ where: { email } });

    if (!userExists) {
      return res
        .status(401)
        .json({ error: 'Email não foi encontrado, crie sua conta!' });
    }

    const tokenAll = await Token.findAll({
      where: {
        user_id: userExists.id,
        status: false,
      },
    }).map(p => p.id);

    await Token.update(
      {
        status: true,
      },
      {
        where: {
          id: tokenAll,
        },
      }
    );

    // Create a verification token for this user
    const { id, code_active } = await Token.create({
      user_id: userExists.id,
      expires: addDays(new Date(), 1),
    });

    await User.update(
      { token_id: id, userExists },
      { where: { id: userExists.id } }
    );

    await Queue.add(ActivationContaMailAWS.key, {
      user: userExists,
      code_active,
    });

    return res.json({
      msg: `Token criado com sucesso, acessa o ${userExists.email} para recuperar sua senha!`,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      password: Yup.string().min(1),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { token } = req.body;
    const tokenExists = await Token.findOne({ where: { token } });

    // Make sure the user has been verified

    if (!tokenExists) {
      return res.status(403).json({
        error: 'Esse token não existe, crei um novo token!',
      });
    }

    const hourStart = startOfSecond(new Date(tokenExists.expires));

    if (!isAfter(hourStart, new Date())) {
      return res.status(404).json({
        error: 'Token expirado, gere novo token, em recuperar senha!',
      });
    }

    const user = await User.findByPk(tokenExists.user_id);
    if (!tokenExists && !user) {
      return res.status(401).json({
        error: 'Não foi possível encontra um usuário para esse token!',
      });
    }

    await user.update(req.body);

    // await tokenExists.update({ status: true });

    await Token.update(
      { status: true, tokenExists },
      { where: { id: tokenExists.id } }
    );

    return res.status(200).json({
      msg:
        'Nova senha cadastrada com sucesso, já pode acessar a área restrita!',
    });
  }
}

export default new RecoverPasswordController();
