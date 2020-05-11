//import Cache from '../../lib/Cache';
import CancelAppointmentService from '../services/CancelAppointmentService';
import IndexAppointmentFilaService from '../services/IndexAppointmentFilaService';

class AppointmentFilaController {
  async index(req, res) {
    const { page } = req.query;
    const { providerId } = req.params;

    /*
    const cachekey = `user:${req.userId}:appointments:${page}`;
    const cached = await Cache.get(cachekey);

    if (cached) {
      return res.json(cached);
    } */
    const { userId } = req;
    const listAppointments = await IndexAppointmentFilaService.run({
      page,
      provider_id: providerId,
      userId,
    });

    // await Cache.set(cachekey, appointments);

    return res.json(listAppointments);
  }

  async delete(req, res) {
    const appointment = await CancelAppointmentService.run({
      provider_id: req.params.id,
      user_id: req.userId,
    });

    //await Cache.invalidatePrefix(`user:${req.userId}:appointments`);

    return res.json(appointment);
  }
}

export default new AppointmentFilaController();
