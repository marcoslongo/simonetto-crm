export function formatHours(horas: number) {
  // Se for menos de 1 hora, mostrar em minutos
  if (horas < 1) {
    const minutos = Math.round(horas * 60);
    return `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
  }

  // Se for menos de 24 horas, mostrar em horas e minutos
  if (horas < 24) {
    const horasInteiras = Math.floor(horas);
    const minutos = Math.round((horas - horasInteiras) * 60);

    if (minutos === 0) {
      return `${horasInteiras} hora${horasInteiras !== 1 ? 's' : ''}`;
    }

    return `${horasInteiras}h ${minutos}min`;
  }

  // Se for 24 horas ou mais, mostrar em dias e horas
  const dias = Math.floor(horas / 24);
  const horasRestantes = Math.round(horas % 24);

  if (horasRestantes === 0) {
    return `${dias} dia${dias !== 1 ? 's' : ''}`;
  }

  return `${dias} dia${dias !== 1 ? 's' : ''} e ${horasRestantes}h`;
}
