export type TipoRecurso = 'video' | 'drive' | 'juego' | 'pdf' | 'imagen' | 'herramienta' | 'otro'

export interface Recurso {
  url: string
  label?: string
  tipo: TipoRecurso
}

export interface Seccion {
  nombre: string
  recursos: Recurso[]
  zona?: 'clase' | 'gym'   // undefined = aparece en ambos
}

export interface Modulo {
  id: string
  nombre: string
  secciones: Seccion[]
}

export interface Curso {
  id: string
  nombre: string
  emoji: string
  modulos: Modulo[]
}

export const CURSOS: Curso[] = [
  // ─────────────────────────────────────────────────────────────
  // 🥁 BATERÍA
  // ─────────────────────────────────────────────────────────────
  {
    id: 'bateria',
    nombre: 'Batería',
    emoji: '🥁',
    modulos: [
      {
        id: 'bateria-nivel-1',
        nombre: 'Nivel 1',
        secciones: [
          {
            nombre: 'Fundamentos',
            recursos: [
              { url: 'https://drive.google.com/file/d/0B4jssYDGXDU_NkZacmVWbEp5dzg/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/0B4jssYDGXDU_YnlkTnF3c0Y4XzA/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/0B4jssYDGXDU_eE5XYkxKcy1waGc/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/0B4jssYDGXDU_SmZsaUVqTGgzT2s/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/0B4jssYDGXDU_cjAzbGt1VWdjVzg/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/0B4jssYDGXDU_MFVZbTNZbWVnQ1E/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/0B4jssYDGXDU_TzN3UFVKZjQtTmM/view', tipo: 'drive' },
            ],
          },
          {
            nombre: 'Recursos y práctica',
            zona: 'gym',
            recursos: [
              { url: 'https://drive.google.com/drive/folders/19-dKtIEKWNT8PRQniREYo5KAZceRZFot', tipo: 'drive' },
              { url: 'https://aprendomusica.com/const2/04dictadoRitmico/game.html', tipo: 'juego', label: 'Dictado rítmico' },
            ],
          },
          {
            nombre: 'Material complementario',
            zona: 'gym',
            recursos: [
              { url: 'https://drive.google.com/file/d/1mOcNWwC95beqMuOta9-dv2J_fQ_AZ3W4/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1VEZ4JunjMGKp_8mFtvfY3djq-8yYOIrB/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1RFAV9CqtjZxUUM_abL5eF8eAim4KhC4L/view', tipo: 'drive' },
              { url: 'https://drive.google.com/drive/u/1/folders/1L_2ox8f8sfGCAozXYlxO4a6gMltBRIbL', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1B8ManFdsu2w1H1VW4s1nZoXhRAr7SDqC/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/16r_KwHZLEtxnBKLO4BFK6gNr6e-_4FZ6/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1M7WNOcsp2GmrPGJco7Z4oI1lGov4_QmM/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1l5Z0LBaf1JvbWb5s4tVRBQuTC42dN-1I/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1TvnywQbsZt_mEgNt1-nchXXkoNCuDRTI/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1RRuyEixM7xyFmTRFeOKDoSkVQtTE6gfN/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/19J2h98CHhqtoHaCuPJanY2Mcb6q0_Euj/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1xdMQhU8TzbIh8sMM76t7_FPMkVZJTJMx/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/15z2K6CFEFH6CoH6d3xJ_RKX22sA_yu4c/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/15hBN7e2H7sJMfRZYaRIQh0i3UoIWaWXR/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/11eBL8ELXAXU3uNKeLUDj4OOONSYNqGds/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/19KYrdqa-T8fTSxj27waws_LjQ1FDms1k/view', tipo: 'drive' },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🏋️ GYM MUSICAL
  // ─────────────────────────────────────────────────────────────
  {
    id: 'gym-musical',
    nombre: 'Gym Musical',
    emoji: '🏋️',
    modulos: [
      {
        id: 'gym-general',
        nombre: 'General',
        secciones: [
          {
            nombre: 'Recursos generales',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=5flxlEQ4YxY', tipo: 'video' },
              { url: 'https://www.sessiontown.com/es/juegos-aplicaciones-musica/metronomo', tipo: 'herramienta', label: 'Metrónomo' },
              { url: 'https://www.youtube.com/watch?v=T9c2kCGrJlo', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=KJYAWpSLkC8', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'gym-nivel-1',
        nombre: 'Nivel 1',
        secciones: [
          {
            nombre: 'Ejercicios',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=Z5ZV4eQkHqg', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=Du2z_mSAREM', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=1zME6I2XQV4', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=Vkr4H1yRWfY', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=DKTLXzqx3H8', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=jDCoUpwqZFw', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=G08RvhtzMe0', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=pJzUtHtjWzw', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=0hOnl2-oK5Q', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=eePx88Ak60U', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=41ViklVf3pM', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=TNqstVeH9t8', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=anosN4GXv58', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=ZvnnFStzx4M', tipo: 'video' },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🎹 PIANO
  // ─────────────────────────────────────────────────────────────
  {
    id: 'piano',
    nombre: 'Piano',
    emoji: '🎹',
    modulos: [
      {
        id: 'piano-modulo-1',
        nombre: 'Módulo 1: Introducción',
        secciones: [
          {
            nombre: 'Clase preparatoria 1',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=vgqXbVay2Lg', tipo: 'video' },
            ],
          },
          {
            nombre: 'Clase preparatoria 2',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=4_AgUMhuHDQ', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'piano-modulo-2',
        nombre: 'Módulo 2: Nivel 1 – Clases',
        secciones: [
          {
            nombre: 'Partituras',
            recursos: [
              { url: 'https://drive.google.com/drive/folders/0Byevmj7vkP25eGpJUDB6ZzluNjg', tipo: 'drive' },
            ],
          },
          {
            nombre: 'Cuckoo',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=wKDi6doJOAE', tipo: 'video' },
            ],
          },
          {
            nombre: 'Lightly Row',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=vwUS8vgvib0', tipo: 'video' },
            ],
          },
          {
            nombre: "French Children's Song",
            recursos: [
              { url: 'https://www.youtube.com/watch?v=DDBYZUXJb9Y', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'piano-modulo-3',
        nombre: 'Módulo 3: Nivel 1 – Práctica',
        secciones: [
          {
            nombre: 'Juegos',
            zona: 'gym',
            recursos: [
              { url: 'https://scratch.mit.edu/projects/146851449/fullscreen', tipo: 'juego' },
              { url: 'https://scratch.mit.edu/projects/68534384/fullscreen/', tipo: 'juego' },
              { url: 'https://scratch.mit.edu/projects/148731524/fullscreen/', tipo: 'juego' },
              { url: 'https://scratch.mit.edu/projects/150381452/fullscreen/', tipo: 'juego' },
              { url: 'https://scratch.mit.edu/projects/148560151/fullscreen', tipo: 'juego' },
              { url: 'https://scratch.mit.edu/projects/147139672/fullscreen/', tipo: 'juego' },
              { url: 'https://scratch.mit.edu/projects/146706397/fullscreen/', tipo: 'juego' },
            ],
          },
        ],
      },
      {
        id: 'piano-modulo-4',
        nombre: 'Módulo 4: Nivel 2 – Clases',
        secciones: [
          {
            nombre: 'Partituras',
            recursos: [
              { url: 'https://drive.google.com/drive/folders/0Byevmj7vkP25eGpJUDB6ZzluNjg', tipo: 'drive' },
            ],
          },
          {
            nombre: 'Go Tell Aunt Rody',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=7FvCsYSbeio', tipo: 'video' },
            ],
          },
          {
            nombre: 'Mary Had a Little Lamb',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=e26WIWVQ1nQ', tipo: 'video' },
            ],
          },
          {
            nombre: 'Cuckoo acompañamiento',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=sTLq8dG7dl8', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'piano-modulo-5',
        nombre: 'Módulo 5: Nivel 2 – Práctica',
        secciones: [
          {
            nombre: 'Obras de repaso',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=1j2REphfeKw', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'piano-modulo-6',
        nombre: 'Módulo 6: Nivel 3 – Clases',
        secciones: [
          {
            nombre: "French Children's Song acompañamiento",
            recursos: [
              { url: 'https://www.youtube.com/watch?v=t0AoNrsRj4c', tipo: 'video' },
            ],
          },
          {
            nombre: 'Go Tell Aunt Rody acompañamiento',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=52ehSFEDYGk', tipo: 'video' },
            ],
          },
          {
            nombre: 'Escalas',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=ZKqtyC205K4', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'piano-modulo-8',
        nombre: 'Módulo 8: Nivel 4 – Clases',
        secciones: [
          {
            nombre: 'Little Playmate',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=pywQJFpQzHo', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'piano-modulo-9',
        nombre: 'Módulo 9: Nivel 4 – Práctica',
        secciones: [
          {
            nombre: 'Juegos',
            zona: 'gym',
            recursos: [
              { url: 'http://www.aprendomusica.com/m_aprendonotas.html', tipo: 'juego', label: 'Aprendo notas' },
              { url: 'https://aprendomusica.com/const2/04dictadoRitmico/game.html', tipo: 'juego', label: 'Dictado rítmico' },
              { url: 'http://www.aprendomusica.com/const2/44instrumsuena/game.html', tipo: 'juego', label: '¿Qué instrumento suena?' },
              { url: 'http://www.aprendomusica.com/const2/30dictadoritmico1/game.html', tipo: 'juego', label: 'Dictado rítmico 1' },
            ],
          },
          {
            nombre: 'Repertorio',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=Vm3zltOg2jM', tipo: 'video', label: 'Allegretto 1' },
              { url: 'https://www.youtube.com/watch?v=tMz8-PV5v0I', tipo: 'video', label: 'Allegretto 2' },
            ],
          },
        ],
      },
      {
        id: 'piano-modulo-10',
        nombre: 'Módulo 10: Nivel 5 – Clases',
        secciones: [
          {
            nombre: 'Partituras',
            recursos: [
              { url: 'https://drive.google.com/drive/folders/0Byevmj7vkP25eGpJUDB6ZzluNjg', tipo: 'drive' },
            ],
          },
          {
            nombre: 'Allegretto',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=Vm3zltOg2jM', tipo: 'video', label: 'Allegretto 1' },
              { url: 'https://www.youtube.com/watch?v=tMz8-PV5v0I', tipo: 'video', label: 'Allegretto 2' },
            ],
          },
        ],
      },
      {
        id: 'piano-modulo-11',
        nombre: 'Módulo 11: Nivel 5 – Práctica',
        secciones: [
          {
            nombre: 'Obras de repaso',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=eePx88Ak60U', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=pJzUtHtjWzw', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=m2htqTHcngY', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=anosN4GXv58', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=MjSUJq81v44', tipo: 'video' },
            ],
          },
          {
            nombre: 'Allegretto práctica',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=qLxxAvZjfDA', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=vXI8PCn81AY', tipo: 'video' },
            ],
          },
          {
            nombre: 'Audiolibro',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=VS8vI6-iVTU', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'piano-modulo-12',
        nombre: 'Módulo 12: Nivel 6 – Clases',
        secciones: [
          {
            nombre: 'Partituras',
            recursos: [
              { url: 'https://drive.google.com/drive/folders/0Byevmj7vkP25eGpJUDB6ZzluNjg', tipo: 'drive' },
            ],
          },
          {
            nombre: 'Allegro',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=2-cq6rjs3XY', tipo: 'video' },
            ],
          },
          {
            nombre: 'Musette',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=unFAUPGxfYc', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'piano-modulo-13',
        nombre: 'Módulo 13: Nivel 6 – Práctica',
        secciones: [
          {
            nombre: 'Obras de repaso',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=EwvsFD-sJxQ', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=KtvaAO1--fo', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=F1QSK3q8olU', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=CjUNHA25hGs', tipo: 'video' },
            ],
          },
          {
            nombre: 'Audiolibro',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=VS8vI6-iVTU', tipo: 'video' },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🎻 VIOLÍN
  // ─────────────────────────────────────────────────────────────
  {
    id: 'violin',
    nombre: 'Violín',
    emoji: '🎻',
    modulos: [
      {
        id: 'violin-modulo-1',
        nombre: 'Módulo 1: Preparatorio',
        secciones: [
          {
            nombre: 'Pre-Violín (Fundamentos)',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=pyRN-sKkHig', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=hF5HZtMo8q4', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=rJa5CIa16l4', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=KKU3vkLJzzg', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=UnAVQHnnEIU', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'violin-modulo-2',
        nombre: 'Módulo 2: Nivel 1 – Clases',
        secciones: [
          {
            nombre: 'Clases',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=xjNi8pT31ns', tipo: 'video', label: 'Clase 1' },
              { url: 'https://www.youtube.com/watch?v=lYGrXpl-BKA', tipo: 'video', label: 'Clase 2' },
              { url: 'https://www.youtube.com/watch?v=1fXiHC7l-QE', tipo: 'video', label: 'Clase 3' },
            ],
          },
        ],
      },
      {
        id: 'violin-modulo-3',
        nombre: 'Módulo 3: Nivel 1 – Práctica',
        secciones: [
          {
            nombre: 'Ejercicios técnicos',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=fVrQsbuqsZ4', tipo: 'video', label: 'Concierto para la cuerda A' },
              { url: 'https://www.youtube.com/watch?v=v3pa8JzJ2Io', tipo: 'video', label: 'Canción para el arco / Ubicación de notas' },
            ],
          },
          {
            nombre: 'Repertorio inicial',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=Rubs0HnN6_8', tipo: 'video', label: 'Canciones pre-Estrellita' },
            ],
          },
        ],
      },
      {
        id: 'violin-modulo-4',
        nombre: 'Módulo 4: Nivel 2 – Clases',
        secciones: [
          {
            nombre: 'Clase base',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=1fXiHC7l-QE', tipo: 'video' },
            ],
          },
          {
            nombre: 'Estrellita',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=ljAg3fF7sME', tipo: 'video', label: 'Estrellita + Variaciones' },
            ],
          },
        ],
      },
      {
        id: 'violin-modulo-5',
        nombre: 'Módulo 5: Nivel 2 – Práctica',
        secciones: [
          {
            nombre: 'Repertorio principal',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=ljAg3fF7sME', tipo: 'video', label: 'Estrellita' },
              { url: 'https://www.youtube.com/watch?v=DQwlRgQCJpc', tipo: 'video', label: 'Variación A' },
              { url: 'https://www.youtube.com/watch?v=-UUoBjF25qU', tipo: 'video', label: 'Variación B' },
              { url: 'https://www.youtube.com/watch?v=GGAKO44KFPE', tipo: 'video', label: 'Variación C' },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🎤 CANTO
  // ─────────────────────────────────────────────────────────────
  {
    id: 'canto',
    nombre: 'Canto',
    emoji: '🎤',
    modulos: [
      {
        id: 'canto-modulo-1',
        nombre: 'Módulo 1: Introducción al Canto',
        secciones: [
          {
            nombre: 'Introducción al curso',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=8W-wlXI14hI', tipo: 'video' },
            ],
          },
          {
            nombre: 'Técnica vocal y respiración',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=DCQ4AO6d_hI', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=UXJrvPtLtEE', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=PraxvMFqC8A', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=hHxnmidwgxU', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=mXxhVVG6rI4', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=sQ1wgX-OjvI', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=MN4lBsyU5gU', tipo: 'video' },
            ],
          },
          {
            nombre: 'Anatomía (soporte vocal)',
            recursos: [
              { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Rotation_Maxilla.gif', tipo: 'imagen', label: 'Maxilar' },
              { url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Rotation_palatine_bone.gif', tipo: 'imagen', label: 'Hueso palatino' },
              { url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Rotation_sphenoid_bone.gif', tipo: 'imagen', label: 'Hueso esfenoides' },
              { url: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Rotation_Vomer_bone.gif', tipo: 'imagen', label: 'Vómer' },
              { url: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Rotation_ethmoid.gif', tipo: 'imagen', label: 'Etmoides' },
            ],
          },
          {
            nombre: 'Molde vocal',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=YrcGGd3CmFs', tipo: 'video' },
            ],
          },
          {
            nombre: 'Introducción al calentamiento',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=x3wRS4zzwu0', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'canto-modulo-2',
        nombre: 'Módulo 2: Nivel 1 – Clases',
        secciones: [
          {
            nombre: 'Calentamiento básico',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=QVTkPfzegIA', tipo: 'video' },
            ],
          },
          {
            nombre: 'Cómo estudiar el texto',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=zTqFLMTLrnA', tipo: 'video' },
            ],
          },
          {
            nombre: 'Repertorio: La Cumbia Cienaguera',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=sWVb36VNH1Y', tipo: 'video', label: 'Canción completa' },
              { url: 'https://www.youtube.com/watch?v=B0YnEBSj4Ts', tipo: 'video', label: 'Parte 1' },
              { url: 'https://www.youtube.com/watch?v=bQVVLPsK-is', tipo: 'video', label: 'Parte 2 y 3' },
            ],
          },
        ],
      },
      {
        id: 'canto-modulo-3',
        nombre: 'Módulo 3: Nivel 1 – Práctica',
        secciones: [
          {
            nombre: 'Calentamiento práctico',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=QVTkPfzegIA', tipo: 'video' },
            ],
          },
          {
            nombre: 'Práctica repertorio',
            zona: 'gym',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=sWVb36VNH1Y', tipo: 'video', label: 'La Cumbia Cienaguera' },
              { url: 'https://www.youtube.com/watch?v=RYQkiN7bTk4', tipo: 'video', label: 'Karaoke' },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🎵 ARMONÍA
  // ─────────────────────────────────────────────────────────────
  {
    id: 'armonia',
    nombre: 'Armonía',
    emoji: '🎵',
    modulos: [
      {
        id: 'armonia-nivel-1',
        nombre: 'Armonía Nivel 1',
        secciones: [
          {
            nombre: 'Lección 1',
            recursos: [
              {
                url: 'https://ovejamusic.com/wp-content/uploads/2026/03/Tarea-1-Bachillerato-Nivel-2.pdf',
                tipo: 'pdf',
                label: 'Tarea 1 Bachillerato Nivel 2',
              },
            ],
          },
          {
            nombre: 'Lección 2',
            recursos: [
              { url: 'https://drive.google.com/file/d/1Xe0tmOrv_ildewwSeLDMsHLFn2GeLlSt/view?usp=sharing', tipo: 'drive' },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🎸 GUITARRA ADULTOS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'guitarra-adultos',
    nombre: 'Guitarra Adultos',
    emoji: '🎸',
    modulos: [
      {
        id: 'guitarra-adultos-nivel-1',
        nombre: 'Nivel 1',
        secciones: [
          {
            nombre: 'Videos',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=9MuJWGdNSKs', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=lEdGusuww2w', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=wc5a_kRGmaA', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=extlxolJLXU', tipo: 'video' },
            ],
          },
          {
            nombre: 'Material (Drive)',
            recursos: [
              { url: 'https://drive.google.com/file/d/1PBYVmeCUiPYTAbfJB04ZRvCw_zMJc0di/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1Wsw6olRZH6UCGlSQUupv4q8sj8ahyY7x/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1wVhpThsWJFtqFiUirppUQoyhDmWAeq68/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1cnV9rbHgZB97pK4u4MWhN-nSOof8mG_q/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1R8P3lE5RedWx0hi9IHQCDeHnwHtmCBOc/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1ZJHq_jNXf9OHGVs_H8a8vNp1yQli3Pi8/view', tipo: 'drive' },
            ],
          },
          {
            nombre: 'Ejercicios y Partituras',
            recursos: [
              { url: 'https://ovejamusic.com/wp-content/uploads/2023/09/Estreellita-1.pdf', tipo: 'pdf', label: 'Estrellita' },
              { url: 'https://ovejamusic.com/wp-content/uploads/2023/09/Ejercicio-No2.pdf', tipo: 'pdf', label: 'Ejercicio No. 2' },
              { url: 'https://ovejamusic.com/wp-content/uploads/2023/09/Lightly-Row.pdf', tipo: 'pdf', label: 'Lightly Row' },
              { url: 'https://ovejamusic.com/wp-content/uploads/2023/09/Cumpleanos-en-C-Ver.2.pdf', tipo: 'pdf', label: 'Cumpleaños en C' },
              { url: 'https://ovejamusic.com/wp-content/uploads/2023/09/CUMPLEANOS-C-Armonia.pdf', tipo: 'pdf', label: 'Cumpleaños en C – Armonía' },
            ],
          },
          {
            nombre: 'Recursos visuales',
            recursos: [
              {
                url: 'https://ovejamusic.com/wp-content/uploads/2023/09/Captura-de-pantalla-2023-09-13-a-las-12.41.26-p.m.png',
                tipo: 'imagen',
              },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🎸 GUITARRA ELÉCTRICA
  // ─────────────────────────────────────────────────────────────
  {
    id: 'guitarra-electrica',
    nombre: 'Guitarra Eléctrica',
    emoji: '🎸',
    modulos: [
      {
        id: 'guitarra-electrica-nivel-1',
        nombre: 'Nivel 1',
        secciones: [
          {
            nombre: 'Videos',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=8TMyGk66OeM', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=WsjXg8CclFo', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=nkRzpr9_lSs', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=wBPBTUPNd1U', tipo: 'video' },
            ],
          },
          {
            nombre: 'Material',
            recursos: [
              { url: 'https://ovejamusic.com/wp-content/uploads/2023/09/Guitar-aeribics-Semana-1.pdf', tipo: 'pdf', label: 'Guitar Aerobics Semana 1' },
              { url: 'https://ovejamusic.com/wp-content/uploads/2023/09/Escala-pentatonica-5-patrones-1.pdf', tipo: 'pdf', label: 'Escala pentatónica – 5 patrones' },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🎶 UKELELE
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ukelele',
    nombre: 'Ukelele',
    emoji: '🎶',
    modulos: [
      {
        id: 'ukelele-nivel-1',
        nombre: 'Nivel 1',
        secciones: [
          {
            nombre: 'Material y ejercicios',
            recursos: [
              { url: 'https://ovejamusic.com/wp-content/uploads/2023/09/Escala-pentatonica-5-patrones-1.pdf', tipo: 'pdf', label: 'Escala pentatónica – 5 patrones' },
              { url: 'https://drive.google.com/file/d/1_sEelXY2FT7Y_OeCD6mrUpkOZCBJYfAW/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1Ekt4dNMiBqMGEgCOPhkF9j3s1a10_7S1/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1OUIwPJXsF7JhzD80oQKSifUnr9BxvrTu/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1-dCioAKXSQE_pOCPDfFIxPjuymkJrM_J/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/14KvtzwPDA-q2b5c2VS4uriAHcux5i_Ql/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1vSipbKBaPZL7yVtPsHum9avOuOt3-5RV/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1bRWZODscX7FZbW0gifdJYKLxg-wRcVWE/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1tEU2tt1BjeOBdlPUP20H2NMvX8c2cper/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1A7K3SsVbZtABs55rfLVHIwW92Os5j1wF/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1krxo9v3fx8WYU4nn9g0fV2cIONjvGb-i/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1XttklrGlG9yyvuD-nhqX-RQRyKvi9ivV/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1IYNYuzBkgstSoi62zDp5QMpXuPr6o27c/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1_4xST6CLEK9PCv1aV-XjAGUsQQcI5HKu/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1rm68Kgz6lMX2xhV0nM3r4cDy8c8PiPaD/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1faMR5Z5Xzx5f6v-SNyFI--vEGaA-eja0/view', tipo: 'drive' },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🎸 GUITARRA – CLASES
  // ─────────────────────────────────────────────────────────────
  {
    id: 'guitarra-clases',
    nombre: 'Guitarra – Clases',
    emoji: '🎸',
    modulos: [
      {
        id: 'guitarra-clases-preparatorios',
        nombre: 'Videos preparatorios',
        secciones: [
          {
            nombre: 'Introducción',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=nlSwrR509dw', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=OY9mz3U2kqg', tipo: 'video' },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 👦 GUITARRA NIÑOS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'guitarra-ninos',
    nombre: 'Guitarra Niños',
    emoji: '👦',
    modulos: [
      {
        id: 'guitarra-ninos-nivel-1',
        nombre: 'Nivel 1',
        secciones: [
          {
            nombre: 'Videos',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=9MuJWGdNSKs', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=lEdGusuww2w', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=wc5a_kRGmaA', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=QfikH9gtLUs', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=oIxT4euK3UM', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=n8YIBnNu6dw', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=E7V-6diwaT4', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=YIPf6ZP4AD4', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=GZ0bi7kzCb0', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=xlOG-t3jacw', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=0K9--mGEK5M', tipo: 'video' },
            ],
          },
          {
            nombre: 'Interactivos (Scratch)',
            recursos: [
              { url: 'https://scratch.mit.edu/projects/146851449/fullscreen', tipo: 'juego' },
              { url: 'https://scratch.mit.edu/projects/68534384/fullscreen/', tipo: 'juego' },
              { url: 'https://scratch.mit.edu/projects/146706397/fullscreen/', tipo: 'juego' },
              { url: 'https://scratch.mit.edu/projects/147139672/fullscreen/', tipo: 'juego' },
              { url: 'https://scratch.mit.edu/projects/148731524/fullscreen/', tipo: 'juego' },
              { url: 'https://scratch.mit.edu/projects/150381452/', tipo: 'juego' },
            ],
          },
          {
            nombre: 'Herramientas',
            recursos: [
              { url: 'https://www.imusic-school.com/en/tools/online-metronome/', tipo: 'herramienta', label: 'Metrónomo' },
            ],
          },
        ],
      },
      {
        id: 'guitarra-ninos-nivel-2',
        nombre: 'Nivel 2',
        secciones: [
          {
            nombre: 'Contenidos',
            recursos: [
              { url: 'https://drive.google.com/file/d/19KZk5GzbfR-C-hGEiDXpCIg-HlHvtO9u/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1uQhsfIjCWxEbN4z8dYkjyaBNg0bfrdP2/view', tipo: 'drive' },
              { url: 'https://drive.google.com/file/d/1iLawLUIJc-cUT-ouGYybok1uZEWUNyIw/view', tipo: 'drive' },
            ],
          },
        ],
      },
      {
        id: 'guitarra-ninos-nivel-3',
        nombre: 'Nivel 3',
        secciones: [
          {
            nombre: 'Videos',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=jO-1W79oS5M', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=ikGyZh0VbPQ', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=44xkDPJdW2Q', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=kvqsVu2RBlE', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'guitarra-ninos-nivel-4',
        nombre: 'Nivel 4',
        secciones: [
          {
            nombre: 'Videos',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=IEPw06KxdOY', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=_qEPzf130sE', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=YHfLyEMW_Cc', tipo: 'video' },
              { url: 'https://www.youtube.com/watch?v=9gGc45WjnpY', tipo: 'video' },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🌐 RECURSOS ADICIONALES
  // ─────────────────────────────────────────────────────────────
  {
    id: 'recursos-adicionales',
    nombre: 'Recursos Adicionales',
    emoji: '🌐',
    modulos: [
      {
        id: 'recursos-adicionales-general',
        nombre: 'General',
        secciones: [
          {
            nombre: 'Teoría musical y práctica',
            recursos: [
              { url: 'https://www.musictheory.net/lessons', tipo: 'herramienta', label: 'Music Theory' },
              { url: 'https://aprendomusica.com/index.html', tipo: 'herramienta', label: 'Aprendo Música' },
            ],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 🎶 CIUDAD MUSICAL
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ciudad-musical',
    nombre: 'Ciudad Musical',
    emoji: '🎶',
    modulos: [
      {
        id: 'ciudad-musical-intro',
        nombre: 'Introducción',
        secciones: [
          {
            nombre: 'Test de conexión musical',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=_7-zXWlfm7w', tipo: 'video' },
            ],
          },
        ],
      },
      {
        id: 'ciudad-musical-nivel-1',
        nombre: 'Nivel 1',
        secciones: [
          {
            nombre: 'Clases',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=-0WLDkqAa9w', tipo: 'video', label: 'Clase 1' },
              { url: 'https://www.youtube.com/watch?v=jvezmaHm4_g', tipo: 'video', label: 'Clase 2' },
              { url: 'https://www.youtube.com/watch?v=MaFRPPeVY9I', tipo: 'video', label: 'Clase 3' },
              { url: 'https://www.youtube.com/watch?v=rym04Hc2MAM', tipo: 'video', label: 'Clase 4' },
              { url: 'https://www.youtube.com/watch?v=IEbo8adbHC0', tipo: 'video', label: 'Clase 5' },
              { url: 'https://www.youtube.com/watch?v=xtI_msYn-io', tipo: 'video', label: 'Clase 6' },
              { url: 'https://www.youtube.com/watch?v=dNuRA_hH7VM', tipo: 'video', label: 'Clase 7' },
              { url: 'https://www.youtube.com/watch?v=HF5OPZ5DXHQ', tipo: 'video', label: 'Clase 8' },
              { url: 'https://www.youtube.com/watch?v=1PASoxxDepI', tipo: 'video', label: 'Clase 9' },
              { url: 'https://www.youtube.com/watch?v=mdYIwgDb0FQ', tipo: 'video', label: 'Clase 10' },
              { url: 'https://www.youtube.com/watch?v=U0UlhwqIe2I', tipo: 'video', label: 'Clase 11' },
              { url: 'https://www.youtube.com/watch?v=yCDXP1oQGNE', tipo: 'video', label: 'Clase 12' },
              { url: 'https://www.youtube.com/watch?v=UwhIN-VBzmI', tipo: 'video', label: 'Clase 13' },
            ],
          },
        ],
      },
      {
        id: 'ciudad-musical-nivel-2',
        nombre: 'Nivel 2',
        secciones: [
          {
            nombre: 'Clases',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=fCV7rxVKhr8', tipo: 'video', label: 'Clase 1' },
              { url: 'https://www.youtube.com/watch?v=mTYIYk3rQGg', tipo: 'video', label: 'Clase 3' },
              { url: 'https://www.youtube.com/watch?v=1HevlFQlex0', tipo: 'video', label: 'Clase 5' },
              { url: 'https://www.youtube.com/watch?v=rG9HAl_faTE', tipo: 'video', label: 'Clase 6' },
              { url: 'https://www.youtube.com/watch?v=Muu28qArYmU', tipo: 'video', label: 'Clase 7' },
              { url: 'https://www.youtube.com/watch?v=ZxuO_apX460', tipo: 'video', label: 'Clase 8' },
              { url: 'https://www.youtube.com/watch?v=po_mymNMPBI', tipo: 'video', label: 'Clase 9' },
              { url: 'https://www.youtube.com/watch?v=B8JxDzjZEsk', tipo: 'video', label: 'Clase 10' },
              { url: 'https://www.youtube.com/watch?v=orzfocmPF_c', tipo: 'video', label: 'Clase 11' },
              { url: 'https://www.youtube.com/watch?v=3ATBAi7NXPU', tipo: 'video', label: 'Clase 12' },
            ],
          },
        ],
      },
      {
        id: 'ciudad-musical-nivel-3',
        nombre: 'Nivel 3',
        secciones: [
          {
            nombre: 'Clases',
            recursos: [
              { url: 'https://www.youtube.com/watch?v=Z_noro-8FP0', tipo: 'video', label: 'Clase 1' },
              { url: 'https://www.youtube.com/watch?v=6BUySlrAMv8', tipo: 'video', label: 'Clase 2' },
              { url: 'https://www.youtube.com/watch?v=OBEOCos-vkQ', tipo: 'video', label: 'Clase 3' },
              { url: 'https://www.youtube.com/watch?v=Ml8rbNr1TIE', tipo: 'video', label: 'Clase 4' },
              { url: 'https://www.youtube.com/watch?v=snexwZpNkcc', tipo: 'video', label: 'Clase 5' },
              { url: 'https://www.youtube.com/watch?v=32t1t60I0XA', tipo: 'video', label: 'Clase 6' },
              { url: 'https://www.youtube.com/watch?v=__Vw31ow6Fc', tipo: 'video', label: 'Clase 7' },
              { url: 'https://www.youtube.com/watch?v=LChMWpVBXaE', tipo: 'video', label: 'Clase 9' },
            ],
          },
        ],
      },
    ],
  },
]
