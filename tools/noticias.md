# Actualizaciones ROG Ally

Edita los datos en `dist/datos/news.json`. Incluye BIOS y firmware (`bios`), controladores (`drivers`), Armoury Crate SE y la app Xbox (`software`) y Windows (`windows`) cuando exista un efecto concreto en la consola.

Usa fuentes oficiales de ASUS, AMD, Microsoft y Xbox. Excluye lanzamientos, tráilers, catálogos y parches de juegos. Una novedad general de PC requiere una relación verificable con el funcionamiento de la consola. Declara `scope: "pc"` para software general y `scope: "model"` para cambios específicos del modelo.

Cada entrada incluye `id` único, `title`, `date` original (AAAA-MM-DD), `category`, `model`, `scope`, `summary` en español, `source` y `url` HTTPS oficial. Añade `version` cuando conste. `impact` es opcional y admite positivo, negativo o informativo. Resume qué cambia y cómo afecta a la consola. Deduplica por anuncio y versión.
