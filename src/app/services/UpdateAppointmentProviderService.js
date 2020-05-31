import Appointment from '../models/Appointment';
import enumAppointment from '../enum/appointments';
import User from '../models/User';

import Cache from '../../lib/Cache';

class UpdateAppointmentProviderService {
  async run({ appointmentId, status }) {

    const appointmentOld = await Appointment.findByPk(appointmentId, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
        },
      ],
    });
    if (!appointmentOld) {
      throw new Error('Appointment not exists.');
    }

    //é obrigatório invalidar a cache aqui, porqu senão caso
    //entre no if a cache não é invalidada

     /**
     * Invalidate cache
     */
    /** invalida o cache do usuário */
    await Cache.invalidatePrefix(`user:${appointmentOld.user_id}:appointments`);

    /** invalida o cache do provider*/
    await Cache.invalidatePrefix(
      `user:${appointmentOld.provider_id}:appointments`
    );

    if (status === enumAppointment.cancelado) {
      const appointment = await appointmentOld.update({
        status,
        canceled_at: new Date(),
      });

      return appointment;
    }

    const appointment = await appointmentOld.update({ status });

    return appointment;
  }
}

export default new UpdateAppointmentProviderService();
