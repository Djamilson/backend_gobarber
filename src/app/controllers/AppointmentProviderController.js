import Cache from '../../lib/Cache';
import CancelAppointmentService from '../services/CancelAppointmentService';
import IndexAppointmentService from '../services/IndexAppointmentService';
import UpdateAppointmentProviderService from '../services/UpdateAppointmentProviderService';

import WebSocket from '../../websocket';

//usuario
async function socketMessage(user_id, arrayView, connectedUsers, appointment) {

  //id => id do appointment
  //user_id => do usuário

  const sendSocketMessageTo = await WebSocket.findConnections(
    user_id,
    arrayView,
    connectedUsers
  );


  if (sendSocketMessageTo) {
    WebSocket.sendMessage(sendSocketMessageTo, 'atender', appointment);
  }
}

class AppointmentProviderController {
  async index(req, res) {
    const { page } = req.query;
    const { userId: provider_id } = req;

    const cachekey = `user:${provider_id}:appointments:${page}`;
    const cached = await Cache.get(cachekey);

    if (cached) {
      return res.json(cached);
    }

    const appointments = await IndexAppointmentService.run({
      page,
      provider_id,
    });

    await Cache.set(cachekey, appointments);

    return res.json(appointments);
  }
//chama quando vai iniciar o atendimento
  async update(req, res) {
    const { appointmentId } = req.params;
    const { status, idDevice } = req.query;

    const connectedUsers = req.connectedUsers;

    const appointment = await UpdateAppointmentProviderService.run({
      appointmentId,
      status,
    });

    const arrayView = [{ value: 'dashboard' }, { value: 'fila' }];
    //enviar atualizarção somente para o usuário
    socketMessage(appointment.user_id, arrayView, connectedUsers, appointment);

    //somente o provider pode está nessa view
    // aqui precisa do idDivece para fazer a comparação
    // para não manda pra mesma máquina

    //enviar atualizarção somente para o priovide caso esteja logado em mais de
    //uma máquiana ao mesmo tempo
    WebSocket.socketMessageAdmin(
      appointment.provider_id,
      idDevice,
      connectedUsers,
      appointment,
      'atender'
    );

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await CancelAppointmentService.run({
      provider_id: req.params.id,
      user_id: req.userId,
    });

    await Cache.invalidatePrefix(`user:${req.userId}:appointments`);

    return res.json(appointment);
  }
}

export default new AppointmentProviderController();
