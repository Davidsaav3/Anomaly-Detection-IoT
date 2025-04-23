const { GoogleGenAI } = require("@google/genai");
const fs = require("fs").promises;
const path = require("path");
const promp = require("./promp");
require("dotenv").config();

// CONFIGURACIÓN DE GEMINI API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY no está configurado en el archivo .env");
  process.exit(1);
}

// LLAMA A GEMINI API
const generateContextsAndPartitions = async (query) => {
  try {
    const start = Date.now();
    const response = await genAI.models.generateContent(query);
    const responseTime = (Date.now() - start) / 1000;

    let responseText = response.text.trim();
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      responseText = jsonMatch[1].trim();
    }

    let output;
    try {
      output = JSON.parse(responseText);
    } catch (parseError) {
      console.error("ERROR AL PARSEAR JSON:", parseError.message);
      console.error("RESPUESTA CRUDA:", responseText);
      throw new Error("La respuesta de la API no es JSON válido");
    }

    return { output, responseTime };
  } catch (e) {
    console.error("ERROR EN GEMINI API:", e.message);
    throw e;
  }
};

// VALIDA SALIDA
const validateOutput = async (output, features) => {
  const validation = { isValid: true, errors: [], coverage: 0 };

  // VERIFICA ASIGNACIÓN DE CARACTERÍSTICAS
  const assigned = new Set(output.createGroups.groups.flatMap((g) => g.fields));
  validation.coverage = (assigned.size / features.length) * 100;

  if (assigned.size !== features.length) {
    validation.isValid = false;
    const missing = features.filter((f) => !assigned.has(f.name)).map((f) => f.name);
    validation.errors.push(`CARACTERÍSTICAS SIN ASIGNAR: ${missing.join(", ")}`);
  }

  // OBTIENE CONTEXTOS ESPERADOS DESDE manual.json
  let expected;
  try {
    const manualData = await fs.readFile("inputs/manual.json", "utf-8");
    const manualResults = JSON.parse(manualData);
    expected = manualResults.createGroups.groups.map((g) => g.output);
  } catch (e) {
    console.error("ERROR AL LEER manual.json PARA VALIDACIÓN:", e.message);
    throw new Error("No se pudo cargar manual.json para obtener contextos esperados");
  }

  const actual = output.createGroups.groups.map((g) => g.output);
  const missingContexts = expected.filter((ctx) => !actual.includes(ctx));
  if (missingContexts.length > 0) {
    validation.isValid = false;
    validation.errors.push(`FALTAN CONTEXTOS: ${missingContexts.join(", ")}`);
  }

  return validation;
};

// COMPARA CON RESULTADOS MANUALES
const compareWithManual = (generated, manual) => {
  let correct = 0,
    total = 0;
  generated.createGroups.groups.forEach((g) => {
    const m = manual.createGroups.groups.find((m) => m.output === g.output);
    if (m) {
      g.fields.forEach((f) => {
        total++;
        if (m.fields.includes(f)) correct++;
      });
    }
  });
  return { precision: total > 0 ? (correct / total) * 100 : 0, correct, total };
};

// EJECUCIÓN PRINCIPAL
async function main() {
  try {
    // CREA DIRECTORIO results SI NO EXISTE
    const resultsDir = "outputs";
    try {
      await fs.mkdir(resultsDir, { recursive: true });
    } catch (e) {
      console.error("ERROR AL CREAR DIRECTORIO results:", e.message);
      throw new Error("No se pudo crear el directorio results");
    }

    // LEE CONFIGURACIÓN IoT
    let features;
    try {
      const configData = await fs.readFile("inputs/features.json", "utf-8");
      features = JSON.parse(configData);
    } catch (e) {
      console.error("ERROR AL LEER features.json:", e.message);
      throw new Error("No se pudo cargar el archivo features.json");
    }

    // LEE RESULTADOS MANUALES DE manual.json
    let manualResults;
    try {
      const manualData = await fs.readFile("inputs/manual.json", "utf-8");
      manualResults = JSON.parse(manualData);
    } catch (e) {
      console.error("ERROR AL LEER manual.json:", e.message);
      throw new Error("No se pudo cargar el archivo manual.json");
    }

    // CREA Y EJECUTA CONSULTA
    const { output, responseTime } = await generateContextsAndPartitions(promp(features.features));

    // VALIDA
    const validation = await validateOutput(output, features.features);

    // GUARDA RESULTADOS
    const results = {
      createGroups: output.createGroups,
      responseTime,
      validation,
    };
    await fs.writeFile(path.join(resultsDir, "automatic.json"), JSON.stringify(results, null, 2));

    // COMPARA CON MANUAL
    results.comparison = compareWithManual(output, manualResults);

    // RESUMEN
    console.log(
      `TIME=${responseTime}s, IS_VALID=${validation.isValid ? "VALID" : "INVALID"}, COVERAGE=${
        validation.coverage
      }%, PRECISION=${results.comparison.precision}%`
    );
    await fs.writeFile(path.join(resultsDir, "automatic_final.json"), JSON.stringify(results, null, 2));
  } catch (e) {
    console.error("ERROR PRINCIPAL:", e.message);
    process.exit(1);
  }
}

// INICIA EJECUCIÓN
main();