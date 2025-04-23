module.exports = (features) => ({
    model: "gemini-1.5-pro",
    contents: `Genera contextos y particiones para estas características IoT:
    ${JSON.stringify(features, null, 2)}
    Ejemplo:
    {"createGroups":{"groups":[{"output":"function_level","fields":["month","day","hour","min","n_px","n_p","truth"]}]}}
    Requisitos:
    1. Contextos: function_level, function_drive, function_pressure, function_flow, position_plaXiquet, position_playa, position_falcon, position_pueblo
    2. Cada característica en al menos un contexto
    3. Posibles asignaciones múltiples
    4. Formato JSON: { createGroups: { groups: [{ output, fields: [] }] } }`,
  });