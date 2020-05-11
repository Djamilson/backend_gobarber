class SortListAppointment {
  run(listAppointments) {
    const newDate = new Date();

    const listAgenda = listAppointments
      .filter(p => {
        if (p.agendar === true && p.date <= newDate) return p;
      })
      .sort(appoint => {
        if (appoint.date <= newDate) return 1;
        return -1;
      });

    const listRest = listAppointments.filter(p => {
      if (p.agendar !== true) return p;
      if (p.agendar === true && p.date > newDate) return p;
    });

    return listAgenda.concat(listRest);
  }
}
export default new SortListAppointment();
