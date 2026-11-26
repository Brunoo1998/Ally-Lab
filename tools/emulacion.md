# Catálogo de Emulación

Edita `tools/emulacion.jsonl` y ejecuta `python3 tools/sincronizar_emulacion.py` desde el repositorio. Incluye el JSON generado en el mismo cambio. Usa `--check` para comprobar que ambos archivos coinciden.

Cada ficha enlaza a la publicación oficial del creador. Comprueba idioma, edición, formato y tamaño allí antes de cambiar el inventario. Las recomendaciones de configuración son puntos de partida.

## Muestra de Arley4d

En Arley4d/TV, los archivos gb.jsonl, gbc.jsonl y gba.jsonl tienen una línea JSON por entrada. Cada catálogo incluye un directorio y entradas de archivo. `type` identifica el tipo; `p` es la ruta, `n` el nombre, `parent` el directorio, `ext` la extensión y `urls` los enlaces. El tamaño es opcional. El idioma carece de campo estructurado. Algunas ediciones lo indican en el nombre.

`python3 tools/sincronizar_emulacion.py --audit-arley ruta/*.jsonl` revisa la estructura. El inventario web se actualiza a partir de fichas revisadas. El identificador y el título normalizado por consola evitan duplicados. GB-Wordyl coincide con registros de gbc.jsonl y usa el ZIP oficial para Game Boy.
