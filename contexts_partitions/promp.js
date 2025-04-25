module.exports = (features) => ({
    model: "gemini-1.5-pro",
    contents: `
    Genera contextos y particiones para las siguientes características de una infraestructura IoT. Cada característica debe estar incluida en al menos un contexto, y se permite que una misma característica forme parte de múltiples contextos si es necesario
    Los nombres de los contextos deben ser únicos y descriptivos, y no deben contener caracteres especiales o espacios. 
    Los nombres de los contextos y particiones que crees deben estar en el idioma que estan las características.    
    CARACTERÍSTICAS: ${JSON.stringify(features, null, 2)}
    FORMATO SALIDA JSON: { createGroups: { groups: [{ output, fields: [] }] } }`,
  });