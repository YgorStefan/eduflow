export interface Lesson {
  id: string
  title: string
}

export interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export const COURSE_MODULES: Module[] = [
  {
    id: 'modulo-1',
    title: 'Módulo 1 — Fundamentos',
    lessons: [
      { id: 'mod1-aula1', title: 'Aula 1 — Introdução ao programa' },
      { id: 'mod1-aula2', title: 'Aula 2 — Mentalidade de crescimento' },
      { id: 'mod1-aula3', title: 'Aula 3 — Definindo seus objetivos' },
    ],
  },
  {
    id: 'modulo-2',
    title: 'Módulo 2 — Estratégia e Planejamento',
    lessons: [
      { id: 'mod2-aula1', title: 'Aula 1 — Mapeando o caminho' },
      { id: 'mod2-aula2', title: 'Aula 2 — Gestão de tempo e prioridades' },
      { id: 'mod2-aula3', title: 'Aula 3 — Criando seu plano de ação' },
      { id: 'mod2-aula4', title: 'Aula 4 — Ferramentas essenciais' },
    ],
  },
  {
    id: 'modulo-3',
    title: 'Módulo 3 — Execução',
    lessons: [
      { id: 'mod3-aula1', title: 'Aula 1 — Da teoria à prática' },
      { id: 'mod3-aula2', title: 'Aula 2 — Superando obstáculos' },
      { id: 'mod3-aula3', title: 'Aula 3 — Consistência e disciplina' },
    ],
  },
  {
    id: 'modulo-4',
    title: 'Módulo 4 — Análise e Resultados',
    lessons: [
      { id: 'mod4-aula1', title: 'Aula 1 — Métricas que importam' },
      { id: 'mod4-aula2', title: 'Aula 2 — Análise de desempenho' },
      { id: 'mod4-aula3', title: 'Aula 3 — Ajustes e otimização' },
      { id: 'mod4-aula4', title: 'Aula 4 — Celebrando conquistas' },
    ],
  },
  {
    id: 'modulo-5',
    title: 'Módulo 5 — Próximos Passos',
    lessons: [
      { id: 'mod5-aula1', title: 'Aula 1 — Escalando seus resultados' },
      { id: 'mod5-aula2', title: 'Aula 2 — Construindo sua rede' },
      { id: 'mod5-aula3', title: 'Aula 3 — Visão de longo prazo' },
    ],
  },
]

export const ALL_LESSON_IDS = COURSE_MODULES.flatMap((m) => m.lessons.map((l) => l.id))
export const TOTAL_LESSONS = ALL_LESSON_IDS.length // 17

export function calcProgressPct(completedLessons: string[]): number {
  if (TOTAL_LESSONS === 0) return 0
  return Math.round((completedLessons.length / TOTAL_LESSONS) * 100)
}
