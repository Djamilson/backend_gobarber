import Mail from '../../lib/Mail';
import mailConfigSESAWS from '../../config/sesAWS';

class ActivationContaMailAWS {
  get key() {
    return 'ActivationContaMailAWS';
  }

  async handle({ data }) {
    const { user, link, code_active } = data;
    const { from } = mailConfigSESAWS.aws.ses;

    const mailOptions = {
      template: 'activation',
      from: from.default,
      to: `${user.name} <${user.email}>`,
      subject: 'Validação de conta',
      context: {
        link,
        user: user.name,
        code_active,
      },
      ReturnPath: from.default,
      Source: from.default,
    };

    try {
      await Mail.sendMail(mailOptions, err => {
        if (err) {
        }
      });
    } catch (err) {}
  }
}

export default new ActivationContaMailAWS();
