export function formatMinutes(minutos:number) {
  // Se for menos de 1 minuto, mostrar em segundos
  if (minutos < 1) {
    const segundos = Math.round(minutos * 60);
    return `${segundos} segundo${segundos !== 1 ? 's' : ''}`;
  }
  
  // Se for menos de 60 minutos, mostrar em minutos
  if (minutos < 60) {
    const minutosArredondados = Math.round(minutos);
    return `${minutosArredondados} minuto${minutosArredondados !== 1 ? 's' : ''}`;
  }
  
  // Se for menos de 24 horas, mostrar em horas e minutos
  if (minutos < 1440) { // 1440 = 24 * 60
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = Math.round(minutos % 60);
    
    if (minutosRestantes === 0) {
      return `${horas} hora${horas !== 1 ? 's' : ''}`;
    }
    
    return `${horas}h ${minutosRestantes}min`;
  }
  
  // Se for 24 horas ou mais, mostrar em dias, horas e minutos
  const dias = Math.floor(minutos / 1440);
  const minutosRestantesDia = minutos % 1440;
  const horas = Math.floor(minutosRestantesDia / 60);
  const minutosFinais = Math.round(minutosRestantesDia % 60);
  
  let resultado = `${dias} dia${dias !== 1 ? 's' : ''}`;
  
  if (horas > 0) {
    resultado += ` e ${horas}h`;
  }
  
  if (minutosFinais > 0 && dias === 0) {
    resultado += ` ${minutosFinais}min`;
  }
  
  return resultado;
}