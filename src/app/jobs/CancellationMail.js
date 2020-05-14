import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/MailCancellation';
import mailConfigSESAWS from '../../config/sesAWS';

class CancellationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { appointment } = data;
    const { from } = mailConfigSESAWS.aws.ses;

    const mailOptions = {
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      from: from.default,
      subject: 'Agendamento cancelado',
      template: 'cancellation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(
          parseISO(appointment.date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    };

    try {
      await Mail.sendMail(mailOptions, err => {
        if (err) {
        }
      });
    } catch (err) {}
  }
}
export default new CancellationMail();
