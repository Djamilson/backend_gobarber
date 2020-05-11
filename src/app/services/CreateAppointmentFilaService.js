import { startOfHour, parseISO, startOfSecond } from 'date-fns';
import File from '../models/File';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Cache from '../../lib/Cache';

class CreateAppointmentFilaService {
  async run({ provider_id, user_id, date, status, agendar }) {
    /*
    Check if provider_id is a provider
    */

    const checkIsProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!checkIsProvider) {
      throw new Error('You can only create appointments with providers');
    }

    if (provider_id === user_id) {
      throw new Error('You not can create appointments');
    }
    /**
     * Check date availability
     */

    const hourStart = startOfSecond(parseISO(date));
    let time = hourStart;

    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      time = startOfHour(parseISO(new Date()));
      // throw new Error('Appointment date is not available');
    }

    const { id: id_ } = await Appointment.create({
      user_id,
      provider_id,
      date: time,
      status,
      agendar,
    });

    const appointment = await Appointment.findByPk(id_, {
      attributes: ['agendar', 'cancelable', 'id', 'date', 'status', 'user_id'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    /**
     * Invalidate cache
     */
    /** invalida o cache do usuário */
    await Cache.invalidatePrefix(`user:${user_id}:appointments`);
    /** invalida o cache do provider*/
    await Cache.invalidatePrefix(`user:${provider_id}:appointments`);

    return appointment;
  }
}
export default new CreateAppointmentFilaService();
