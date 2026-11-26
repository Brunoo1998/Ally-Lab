const sameBoy = ['SameBoy', 'Emulación precisa de Game Boy y Game Boy Color, con guardado rápido.', 'https://sameboy.github.io/downloads/'];
const dolphin = ['Dolphin', 'Permite aumentar la resolución interna y configurar el mando.', 'https://dolphin-emu.org/download/'];
const genesis = ['Genesis Plus GX', 'Núcleo de RetroArch con amplia compatibilidad para consolas clásicas de Sega.', 'https://docs.libretro.com/library/genesis_plus_gx/'];

export const retroEmuladores = {
  nes: ['Mesen', 'Emulación precisa de NES y Famicom con guardado rápido.', 'https://www.mesen.ca/'],
  snes: ['Snes9x', 'Emulador ligero de Super Nintendo, fácil de configurar.', 'https://github.com/snes9xgit/snes9x/releases'],
  n64: ['Rosalie’s Mupen GUI', 'Integra Mupen64Plus en una interfaz gráfica con perfiles de mando.', 'https://github.com/Rosalie241/RMG/releases'],
  gb: sameBoy,
  gbc: sameBoy,
  gba: ['mGBA', 'Emulador ligero de Game Boy Advance con guardado rápido.', 'https://mgba.io/downloads.html'],
  psx: ['DuckStation', 'Permite subir la resolución interna y suavizar la geometría con PGXP.', 'https://www.duckstation.org/'],
  ps2: ['PCSX2', 'Permite ampliar la resolución interna. Requiere una BIOS extraída de tu PS2.', 'https://pcsx2.net/downloads/'],
  dreamcast: ['Flycast', 'Emulador de Dreamcast con renderizado Vulkan y guardado rápido.', 'https://github.com/flyinghead/flycast/releases'],
  atari2600: ['Stella', 'Emulador dedicado a Atari 2600 con soporte de mandos y filtros de imagen.', 'https://stella-emu.github.io/'],
  '3ds': ['Azahar', 'Emulador de Nintendo 3DS para Windows con disposición configurable de las dos pantallas.', 'https://github.com/Azahar-Emu/Azahar/releases'],
  nds: ['melonDS', 'Permite ordenar las dos pantallas y configurar su tamaño.', 'https://github.com/melonDS-emu/melonDS/releases'],
  gamecube: dolphin,
  switch: ['Eden', 'Emulador de Nintendo Switch para Windows. La compatibilidad depende del juego.', 'https://git.eden-emu.dev/eden-emu/eden/releases'],
  wii: ['Dolphin', 'Permite asignar movimientos del mando de Wii o conectar un Wii Remote compatible.', 'https://dolphin-emu.org/download/'],
  wiiu: ['Cemu', 'Emulador de Wii U con paquetes gráficos por juego y renderizado Vulkan.', 'https://cemu.info/'],
  psp: ['PPSSPP', 'Permite subir la resolución interna y jugar con el mando integrado.', 'https://www.ppsspp.org/download/'],
  psvita: ['Vita3K', 'La compatibilidad depende del juego. Consulta su lista oficial antes de instalarlo.', 'https://vita3k.org/compatibility.html'],
  gamegear: genesis,
  mastersystem: genesis,
  megadrive: genesis,
  saturn: ['Beetle Saturn', 'Núcleo de RetroArch centrado en la precisión. Requiere una BIOS de la región del juego.', 'https://docs.libretro.com/library/beetle_saturn/'],
  xbox: ['xemu', 'Emulador de la Xbox original. Consulta la compatibilidad de cada juego en su web.', 'https://xemu.app/'],
  xbox360: ['Xenia Canary', 'Emulador experimental de Xbox 360. La compatibilidad y el rendimiento varían por juego.', 'https://github.com/xenia-canary/xenia-canary/releases']
};
