/**
 * ChatGPT Web Session Extractor
 * 
 * Instrucciones:
 * 1. Abre https://chatgpt.com e inicia sesión.
 * 2. Presiona F12 para abrir las Developer Tools (Herramientas de Desarrollador).
 * 3. Ve a la pestaña "Console" (Consola).
 * 4. Pega este código completo y presiona Enter.
 * 5. El JSON generado se copiará automáticamente a tu portapapeles.
 * 6. Pégalo en el panel de administración de ValueMySaaS.
 */

(() => {
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return "";
  };
  
  const token0 = getCookie("__Secure-next-auth.session-token.0") || getCookie("__Secure-next-auth.session-token") || "";
  const token1 = getCookie("__Secure-next-auth.session-token.1") || "";
  const clearance = getCookie("cf_clearance") || "";
  
  const result = {
    session_token_part0: token0,
    session_token_part1: token1,
    cf_clearance: clearance,
    user_agent: navigator.userAgent
  };
  
  const jsonStr = JSON.stringify(result, null, 2);
  console.log("=== JSON EXTRAÍDO ===");
  console.log(jsonStr);
  console.log("=====================");
  
  try {
    // Intento de copiar al portapapeles
    const tempInput = document.createElement("textarea");
    tempInput.value = jsonStr;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    console.log("✅ ¡JSON copiado exitosamente al portapapeles!");
    console.log("👉 Ahora pégalo en el panel de administración de ValueMySaaS.");
  } catch(e) {
    console.warn("⚠️ No se pudo copiar automáticamente. Por favor selecciona y copia el JSON de arriba manualmente.");
  }
})();
