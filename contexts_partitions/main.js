const { GoogleGenAI } = require("@google/genai");
const fs = require("fs").promises;
const path = require("path");
const promp = require("./promp");
require("dotenv").config();


// CONFIGURACIÓN DE GEMINI API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
if (!process.env.GEMINI_API_KEY) throw new Error("FALTA GEMINI_API_KEY");


// LLAMA A GEMINI API Y VALIDA SALIDA
async function generateAndValidate(query, features) {
  const start = Date.now();
  const { text } = await genAI.models.generateContent(query);
  const responseTime = (Date.now() - start) / 1000;

  // EXTRAER JSON DE LA RESPUESTA
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)?.[1] || text;
  let output;
  try {
    output = JSON.parse(jsonMatch.trim());
  } 
  catch (e) {
    console.error("ERROR AL PARSEAR JSON:", e.message);
    throw new Error("RESPUESTA NO ES JSON VÁLIDO");
  }

  // VALIDAR ASIGNACIÓN DE CARACTERÍSTICAS
  const assigned = new Set(output.createGroups.groups.flatMap(g => g.fields));
  const validation = {
    isValid: assigned.size === features.length,
    errors: assigned.size !== features.length 
      ? [`FALTAN: ${features.filter(f => !assigned.has(f.name)).map(f => f.name).join(", ")}`] 
      : [],
    assignmentRate: (assigned.size / features.length) * 100
  };

  return { output, responseTime, validation };
}


// EJECUCIÓN PRINCIPAL
async function main() {
  try {
    // CREAR DIRECTORIO RESULTS
    await fs.mkdir(process.env.OUTPUT_DIR, { recursive: true });

    // LEER CONFIGURACIÓN Y RESULTADOS MANUALES
    const [features, manual] = await Promise.all([
      fs.readFile(process.env.FEATURES_FILE_PATH, "utf-8").then(JSON.parse),
      fs.readFile(process.env.MANUAL_FILE_PATH, "utf-8").then(JSON.parse)
    ]);

    // GENERAR, VALIDAR Y COMPARAR
    const { output, responseTime, validation } = await generateAndValidate(promp(features.features), features.features);

    // GUARDAR RESULTADOS
    const results = { createGroups: output.createGroups, responseTime, validation };
    const outputPath = path.join(process.env.OUTPUT_DIR, process.env.AUTOMATIC_OUTPUT_FILE);
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));

    // MENSAJES DE SALIDA
    console.log(`TIME=${responseTime}s, ${validation.isValid ? "VALID" : "INVALID"}, ASSIGNMENTRATE=${validation.assignmentRate}%`);
  } 
  catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  }
}


main();