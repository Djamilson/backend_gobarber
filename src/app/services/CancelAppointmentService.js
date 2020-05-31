import { isBefore, subHours } from 'date-fns';
import Appointment from '../models/Appointment';
import User from '../models/User';
import enumAppointment from '../enum/appointments';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

import Cache from '../../lib/Cache';

class CancelAppointmentService {
  async run({ appointment_id, user_id }) {
    const appointment = await Appointment.findByPk(appointment_id, {
      include: [
        { model: User, as: 'provider', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
    });

    if (appointment.user_id !== user_id) {
      throw new Error("You don't have permission to cancel this appointments.");
    }
    // vou mudar para 1 uma hora
    const dateWithSub = subHours(appointment.date, 1);
    if (isBefore(dateWithSub, new Date())) {
      throw new Error(' you can only cancel appointments 1 hours in advance.');
    }

    appointment.canceled_at = new Date();
    appointment.status = enumAppointment.cancelado;

    await appointment.save();

    await Queue.add(CancellationMail.key, { appointment });

    /**
     * Invalidate cache
     */
    /** invalida o cache do usuário */
    await Cache.invalidatePrefix(`user:${appointment.user_id}:appointments`);
    /** invalida o cache do provider*/
    await Cache.invalidatePrefix(`user:${appointment.provider_id}:appointments`);
  
    return appointment;
  }
}

export default new CancelAppointmentService();
