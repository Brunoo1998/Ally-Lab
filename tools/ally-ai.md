# Ally AI en Cloudflare Pages

## Configuración de producción

1. En Cloudflare, abre **Workers & Pages → ally-lab → Settings → Bindings** y añade **Workers AI** con el nombre `AI` en producción.
2. Crea una base **D1** en el plan gratuito. Ejecuta las sentencias de [ally-ai-limits.sql](ally-ai-limits.sql) en su consola y añade el binding **D1 database** con el nombre `ALLY_AI_LIMITS` al proyecto Pages.
3. En **Settings → Variables and Secrets**, añade como secreto de producción `ALLY_AI_RATE_SECRET`. Usa un valor aleatorio de al menos 24 caracteres, por ejemplo la salida de `openssl rand -hex 32`.
4. Vuelve a desplegar. Abre Ally AI y envía «Quiero jugar a Battlefield a 60 FPS». En la respuesta de red de `POST /api/ally-ai`, verifica `mode: "ai"` y `model: "@cf/zai-org/glm-4.7-flash"`. Esas propiedades se emiten únicamente tras recibir y validar una respuesta del modelo o reutilizar una respuesta previamente validada de una pregunta pública.

Workers AI respeta la cuota de la cuenta en el plan gratuito. Ally AI limita las llamadas por IP mediante D1 y aplica un tope global por día. D1 solo almacena contadores y claves derivadas con HMAC. Las consultas no se guardan en D1. El historial del chat vive en la sesión de la pestaña. «Solo buscar» funciona con los datos públicos aunque falte el binding de IA o se agote la cuota.

## Datos y actualización

La recuperación lee los archivos vigentes del despliegue, la rama pública de promociones y los catálogos Retro publicados por su fuente. Las fichas de PC usan los JSON mensuales y reutilizan el modelo del simulador. Los catálogos públicos de PC, recompilaciones y Retro se mantienen en memoria un máximo de cinco minutos en cada instancia. Los archivos de promociones externos pueden permanecer hasta diez minutos en caché. Los nuevos registros y ajustes en esas fuentes se incorporan sin reentrenar. Para incorporar un apartado nuevo con un esquema distinto, añade su adaptador y ruta en `functions/lib/ally-data.js`.

El modelo recibe únicamente la consulta y un máximo de seis coincidencias resumidas. El servidor valida la selección y genera los enlaces y cifras a partir de los datos recuperados.
