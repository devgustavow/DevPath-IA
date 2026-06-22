/* ============================================================================
 * Sistema de progressão: OFENSIVA (streak de dias consecutivos) e
 * DEFENSIVA (escudos/"freezes" que protegem o streak quando você falha um dia).
 * Inspirado em Duolingo: consistência > intensidade.
 * ==========================================================================*/

const DAY_MS = 86400000

// Chave de dia no formato YYYY-MM-DD (UTC) para comparar datas.
function dayKey(d = new Date()) {
  return new Date(d).toISOString().slice(0, 10)
}

function daysBetween(fromKey, toKey) {
  const a = new Date(fromKey + 'T00:00:00Z').getTime()
  const b = new Date(toKey + 'T00:00:00Z').getTime()
  return Math.round((b - a) / DAY_MS)
}

export function defaultStreak() {
  return { count: 0, longest: 0, lastActiveDate: null, freezes: 1 }
}

/* Registra uma atividade do usuário e atualiza a ofensiva.
 * Regras:
 *  - Mesma data: não conta de novo.
 *  - Dia seguinte: +1 na ofensiva.
 *  - Pulou dias: consome escudos (defensiva) p/ cobrir os dias perdidos;
 *    se não tiver escudos suficientes, a ofensiva reseta para 1.
 *  - A cada 7 dias de ofensiva, ganha +1 escudo (máx. 5).
 * Retorna { usedFreeze, milestone, gainedFreeze }. */
export function touchStreak(user) {
  if (!user.streak) user.streak = defaultStreak()
  const s = user.streak
  const today = dayKey()

  let usedFreeze = false
  if (s.lastActiveDate === today) {
    // já praticou hoje — nada muda
  } else if (!s.lastActiveDate) {
    s.count = 1
  } else {
    const gap = daysBetween(s.lastActiveDate, today)
    if (gap === 1) {
      s.count += 1
    } else {
      const missed = gap - 1
      if (s.freezes >= missed) {
        s.freezes -= missed
        s.count += 1
        usedFreeze = true
      } else {
        s.count = 1
      }
    }
  }

  s.lastActiveDate = today
  if (s.count > s.longest) s.longest = s.count

  // Defensiva: recompensa a cada 7 dias de ofensiva.
  let milestone = null
  let gainedFreeze = false
  if (s.count > 0 && s.count % 7 === 0 && s.freezes < 5) {
    s.freezes += 1
    milestone = s.count
    gainedFreeze = true
  }

  return { usedFreeze, milestone, gainedFreeze }
}

/* Estado do streak para EXIBIÇÃO (não muta nada). Calcula se a ofensiva
 * ainda está viva considerando o tempo desde a última atividade. */
export function currentStreak(user) {
  const s = user.streak || defaultStreak()
  const base = { count: s.count, longest: s.longest, freezes: s.freezes, lastActiveDate: s.lastActiveDate }

  if (!s.lastActiveDate) return { ...base, count: 0, status: 'idle' }

  const gap = daysBetween(s.lastActiveDate, dayKey())
  if (gap <= 0) return { ...base, status: 'active' } // praticou hoje
  if (gap === 1) return { ...base, status: 'pending' } // precisa praticar hoje

  const missed = gap - 1
  if (s.freezes >= missed) return { ...base, status: 'at_risk' } // escudos seguram
  return { ...base, count: 0, status: 'broken' } // perdeu a ofensiva
}
