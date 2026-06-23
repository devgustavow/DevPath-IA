import express from 'express'

/* ============================================================================
 * Exportação do roadmap para GitHub Issues.
 * Recebe um token (PAT) do usuário, cria uma MILESTONE por sprint e uma ISSUE
 * por tarefa (com a Definition of Done no corpo). O token é usado só nesta
 * requisição — nunca é salvo no servidor.
 * ==========================================================================*/

const router = express.Router()
const API = 'https://api.github.com'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'DevPath-AI',
    'Content-Type': 'application/json',
  }
}

// POST /api/export/github-issues  { token, owner, repo, project, sprints }
router.post('/export/github-issues', async (req, res) => {
  const { token, owner, repo, project, sprints } = req.body || {}
  if (!token || !owner || !repo) {
    return res.status(400).json({ error: 'Informe token, owner e repo (ex: owner=usuario, repo=meu-projeto).' })
  }
  if (!Array.isArray(sprints) || sprints.length === 0) {
    return res.status(400).json({ error: 'Nenhum sprint para exportar.' })
  }

  const headers = ghHeaders(token)

  try {
    // 1) Valida token + repositório.
    const repoRes = await fetch(`${API}/repos/${owner}/${repo}`, { headers })
    if (repoRes.status === 401) return res.status(401).json({ error: 'Token inválido ou sem permissão.' })
    if (repoRes.status === 404)
      return res.status(404).json({ error: `Repositório ${owner}/${repo} não encontrado (ou o token não o acessa).` })
    if (!repoRes.ok) return res.status(502).json({ error: `GitHub respondeu ${repoRes.status}.` })

    let issuesCreated = 0
    let milestonesCreated = 0
    const errors = []

    // Limite de segurança contra rate-limit secundário do GitHub.
    const MAX_ISSUES = 60

    for (let i = 0; i < sprints.length && issuesCreated < MAX_ISSUES; i++) {
      const s = sprints[i] || {}
      const sprintNo = i + 1

      // 2) Milestone por sprint.
      let milestoneNumber = null
      try {
        const msRes = await fetch(`${API}/repos/${owner}/${repo}/milestones`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: `Sprint ${sprintNo} · ${s.title || ''}`.trim(),
            description: s.goal || '',
          }),
        })
        if (msRes.ok) {
          milestoneNumber = (await msRes.json()).number
          milestonesCreated++
        }
        await sleep(250)
      } catch {
        /* segue sem milestone */
      }

      // 3) Uma issue por tarefa do sprint.
      const dod = (s.checklist || []).map((c) => `- [ ] ${c}`).join('\n')
      const tasks = s.tasks || []
      for (const task of tasks) {
        if (issuesCreated >= MAX_ISSUES) break
        const taskTitle = typeof task === 'string' ? task : task?.title || ''
        if (!taskTitle) continue

        const body = [
          `> Parte do **Sprint ${sprintNo} — ${s.title || ''}** do projeto **${project || repo}**.`,
          s.goal ? `\n🎯 **Meta do sprint:** ${s.goal}` : '',
          dod ? `\n### ✅ Definition of Done\n${dod}` : '',
          `\n\n_Gerado automaticamente pela DevPath AI._`,
        ]
          .filter(Boolean)
          .join('\n')

        try {
          const issueRes = await fetch(`${API}/repos/${owner}/${repo}/issues`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              title: taskTitle,
              body,
              labels: ['devpath-ai', `sprint-${sprintNo}`],
              ...(milestoneNumber ? { milestone: milestoneNumber } : {}),
            }),
          })
          if (issueRes.ok) {
            issuesCreated++
          } else {
            const e = await issueRes.json().catch(() => ({}))
            errors.push(`"${taskTitle}": ${e.message || issueRes.status}`)
          }
          await sleep(300) // evita o rate-limit secundário de criação
        } catch (err) {
          errors.push(`"${taskTitle}": ${err.message}`)
        }
      }
    }

    res.json({
      ok: true,
      issuesCreated,
      milestonesCreated,
      issuesUrl: `https://github.com/${owner}/${repo}/issues`,
      errors: errors.slice(0, 5),
    })
  } catch (err) {
    console.error('[export/github-issues]', err.message)
    res.status(502).json({ error: 'Falha ao falar com o GitHub.', detail: err.message })
  }
})

export default router
