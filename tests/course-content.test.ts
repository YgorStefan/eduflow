import { COURSE_MODULES, ALL_LESSON_IDS, TOTAL_LESSONS, calcProgressPct } from '@/lib/course-content'

describe('course-content', () => {
  it('tem 5 módulos', () => {
    expect(COURSE_MODULES).toHaveLength(5)
  })

  it('tem 17 aulas no total', () => {
    expect(TOTAL_LESSONS).toBe(17)
  })

  it('todos os IDs de aula são únicos', () => {
    const ids = new Set(ALL_LESSON_IDS)
    expect(ids.size).toBe(ALL_LESSON_IDS.length)
  })

  it('calcProgressPct retorna 0 sem aulas concluídas', () => {
    expect(calcProgressPct([])).toBe(0)
  })

  it('calcProgressPct retorna 100 com todas as aulas', () => {
    expect(calcProgressPct(ALL_LESSON_IDS)).toBe(100)
  })

  it('calcProgressPct retorna valor proporcional', () => {
    // 1 de 17 ≈ 6%
    expect(calcProgressPct(['mod1-aula1'])).toBe(6)
  })
})
