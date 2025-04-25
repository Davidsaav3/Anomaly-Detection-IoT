module.exports = (features) => ({
    model: "gemini-1.5-pro",
    contents: `
    Agrupar características de ${JSON.stringify(features, null, 2)} (JSON con "features": [{name, description, type, unit}]) en contextos (prefijo de partición, ej. "position", "function") y particiones (ej. "position_pueblo"). Todas las características deben estar en al menos una partición, algunas en varias. Usar ${JSON.stringify(features, null, 2)} como entrada real; el ejemplo abajo es solo para entender la lógica.

    Ejemplo Input (referencia):
    {"features": [{"name": "month", "description": "Mes de recolección", "type": "integer", "unit": "mes"}, {"name": "day", "description": "Día de recolección", "type": "integer", "unit": "día"}, {"name": "hour", "description": "Hora de recolección", "type": "integer", "unit": "hora"}, {"name": "min", "description": "Minuto de recolección", "type": "integer", "unit": "minuto"}, {"name": "n_px", "description": "Posición X", "type": "float", "unit": "unidades"}, {"name": "n_p", "description": "Posición", "type": "float", "unit": "unidades"}, {"name": "i_uiip", "description": "Corriente drive", "type": "float", "unit": "amperios"}, {"name": "i_f", "description": "Corriente final", "type": "float", "unit": "amperios"}, {"name": "i_uiipu", "description": "Corriente pueblo", "type": "float", "unit": "amperios"}, {"name": "p_uiip", "description": "Presión drive", "type": "float", "unit": "pascal"}, {"name": "p_f", "description": "Presión final", "type": "float", "unit": "pascal"}, {"name": "p_pu", "description": "Presión pueblo", "type": "float", "unit": "pascal"}, {"name": "ce_px", "description": "Flujo X", "type": "float", "unit": "litros/segundo"}, {"name": "cs_px", "description": "Flujo secundario X", "type": "float", "unit": "litros/segundo"}, {"name": "c_pu_p", "description": "Flujo pueblo", "type": "float", "unit": "litros/segundo"}, {"name": "truth", "description": "Verdad de anomalías", "type": "boolean", "unit": "N/A"}]}

    Output Formato:
    JSON con "createGroups": {"groups": [{output: partición, fields: [nombres_características]}]}.

    Ejemplo Output (referencia):
    {"createGroups": {"groups": [{"output": "function_level", "fields": ["month", "day", "hour", "min", "n_px", "n_p", "truth"]}, {"output": "function_drive", "fields": ["month", "day", "hour", "min", "i_uiip", "i_f", "i_uiipu", "truth"]}, {"output": "function_pressure", "fields": ["month", "day", "hour", "min", "p_uiip", "p_f", "p_pu", "truth"]}, {"output": "function_flow", "fields": ["month", "day", "hour", "min", "ce_px", "cs_px", "c_pu_p", "truth"]}, {"output": "position_plaXiquet", "fields": ["month", "day", "hour", "min", "n_px", "ce_px", "cs_px", "truth"]}, {"output": "position_playa", "fields": ["month", "day", "hour", "min", "n_p", "i_uiip", "p_uiip", "truth"]}, {"output": "position_falcon", "fields": ["month", "day", "hour", "min", "i_f", "p_f", "truth"]}, {"output": "position_pueblo", "fields": ["month", "day", "hour", "min", "i_uiipu", "c_pu_p", "p_pu", "truth"]}]}}

    Instrucciones:
    Analizar ${JSON.stringify(features, null, 2)} por name, description, type, unit.
    Agrupar en particiones (ej. "function_drive") bajo contextos (ej. "function") según relevancia semántica.
    Incluir temporales (ej. month, day, hour, min) y "truth" en todas las particiones.
    Asignar otras características a particiones relevantes, permitiendo múltiples asignaciones.
    Asegurar todas las características estén en al menos una partición.
    Generar JSON con "createGroups" y "groups" como el ejemplo.
    Tarea:
    Usar ${JSON.stringify(features, null, 2)} para generar JSON agrupando características en contextos y particiones, siguiendo la estructura del ejemplo.`,
  });