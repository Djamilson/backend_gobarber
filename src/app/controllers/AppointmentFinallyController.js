import enumAppointment from '../enum/appointments';
import IndexAppointmentFilaService from '../services/IndexAppointmentFilaService';
import IndexAppointmentService from '../services/IndexAppointmentService';
import UpdateAppointmentProviderService from '../services/UpdateAppointmentProviderService';
import WebSocket from '../../websocket';

class AppointmentFinallyController {
  //entra quando for finalizar o atendimento
  async update(req, res) {
    const { appointmentId } = req.params;
    const { status, idDevice } = req.query;
    const connectedUsers = req.connectedUsers;

    const appointmentSelect = await UpdateAppointmentProviderService.run({
      appointmentId,
      status,
    });

    const { id, user_id, provider_id } = appointmentSelect;

    const appointments = await IndexAppointmentService.run({
      page: 1,
      provider_id: req.userId,
    });

    //cancelar_appointment

    // filtrar as conexoes value 'dashboard' ou value 'dashboard_admin'
    // e que tem tenha no uma tecnologia
    // envia mensagem de atendedo para

    const arrayView = [{ value: 'dashboard' }];
    const data = { id, status }; // dados que serão enviado para o frontend atualizar
    //a lista

    //enviar atualizarção somente para o usuário
    WebSocket.socketMessage(
      user_id,
      arrayView,
      connectedUsers,
      data,
      'finally'
    );

    //caso o usuario esteja na fila recebe a message tratada

    if (
      status === enumAppointment.finalizado ||
      status === enumAppointment.cancelado
    ) {
      const page = 1;
      const appointmentsdodia = await IndexAppointmentService.run({
        page,
        provider_id,
      });

      // pegar
      const uniq = appointmentsdodia
        .map(app => app.user.id)
        .reduce((json, val) => ({ ...json, [val]: (json[val] || 0) + 1 }), {});

      const result = Object.keys(uniq).map(function(key) {
        return { id: String(key), ind: uniq[key] };
      });

      const arrayViewFila = [{ value: 'fila' }];

      result.forEach(async element => {
        const listAppointments = await IndexAppointmentFilaService.run({
          page,
          provider_id,
          userId: element.id,
        });

        WebSocket.socketMessage(
          element.id,
          arrayViewFila,
          connectedUsers,
          {
            listAppointments,
            status,
            appointmentSelect,
            user_id,
          },
          'finally'
        );
      });
    }

    //somente o provider pode está nessa view
    // aqui precisa do idDevice para fazer a comparação
    // para não manda pra mesma máquina

    //enviar atualização somente para o propietário caso esteja logado em mais de
    //uma máquina ao mesmo tempo

    const dataView = 'finally'; // variável que o usuário vai receber no frontend

    WebSocket.socketMessageAdmin(
      provider_id,
      idDevice,
      connectedUsers,
      appointmentSelect,
      dataView
    );

    /*
    if (
      status === enumAppointment.cancelado ||
      status === enumAppointment.finalizado
    ) {
      const page = 1;
      const appointmentsdodia = await IndexAppointmentService.run({
        page,
        provider_id,
      });

      // pegar
      const uniq = appointmentsdodia
        .map(app => app.user.id)
        .reduce((json, val) => ({ ...json, [val]: (json[val] || 0) + 1 }), {});

      const result = Object.keys(uniq).map(function(key) {
        return { id: String(key), ind: uniq[key] };
      });

      result.forEach(async element => {
        const listAppointments = await IndexAppointmentFilaService.run({
          page,
          provider_id,
          userId: element.id,
        });

        WebSocket.socketMessage(
          element.id,
          arrayView,
          connectedUsers,
          {
            listAppointments,
            status,
            appointmentSelect,
            user_id,
          },
          'finally'
        );
      });
    }

    */

    return res.json(appointments);
  }
}

export default new AppointmentFinallyController();
