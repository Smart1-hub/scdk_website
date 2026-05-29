const Anthropic = require('@anthropic-ai/sdk');
const db        = require('../config/db');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are SCDK AI, an intelligent assistant embedded in the SCDK Smart City Platform. 
You help urban planners, engineers, GIS analysts, and project managers make better decisions.

Your expertise includes:
- Smart city planning and infrastructure development
- GIS and geospatial analysis interpretation
- IoT sensor data analysis and anomaly detection
- Urban sustainability and green city initiatives
- Project management for large-scale civic infrastructure
- Digital twin technology and simulation
- PostGIS spatial queries and map interpretation

When given project or sensor data, provide actionable, precise insights.
Keep responses concise and professional. Format complex data as bullet points or tables where helpful.
Always cite any data points provided to you in context.`;

// ─── GET /api/ai/conversations ────────────────────────────────────────────────
async function getConversations(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT c.*, COUNT(m.id)::int AS message_count
       FROM ai_conversations c
       LEFT JOIN ai_messages m ON m.conversation_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id ORDER BY c.updated_at DESC LIMIT 30`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch conversations.' });
  }
}

// ─── POST /api/ai/conversations ───────────────────────────────────────────────
async function createConversation(req, res) {
  const { title, projectId } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO ai_conversations (user_id, project_id, title) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, projectId || null, title || 'New Conversation']
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create conversation.' });
  }
}

// ─── GET /api/ai/conversations/:id/messages ───────────────────────────────────
async function getMessages(req, res) {
  try {
    const { rows } = await db.query(
      'SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
}

// ─── POST /api/ai/conversations/:id/messages — main chat endpoint ─────────────
async function sendMessage(req, res) {
  const { content, includeProjectContext } = req.body;
  const conversationId = req.params.id;

  if (!content?.trim()) {
    return res.status(400).json({ success: false, message: 'Message content required.' });
  }

  try {
    // Verify conversation belongs to user
    const { rows: convRows } = await db.query(
      'SELECT * FROM ai_conversations WHERE id = $1 AND user_id = $2',
      [conversationId, req.user.id]
    );
    if (!convRows.length) return res.status(404).json({ success: false, message: 'Conversation not found.' });

    const conversation = convRows[0];

    // Build project context if requested
    let contextBlock = '';
    if (includeProjectContext && conversation.project_id) {
      const { rows: projRows } = await db.query(`
        SELECT p.name, p.status, p.phase, p.city, p.country, p.progress, p.budget, p.budget_spent,
          COUNT(DISTINCT t.id) AS total_tasks,
          COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') AS completed_tasks,
          COUNT(DISTINCT s.id) AS sensor_count,
          COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'online') AS online_sensors
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        LEFT JOIN sensors s ON s.project_id = p.id
        WHERE p.id = $1
        GROUP BY p.id
      `, [conversation.project_id]);

      if (projRows.length) {
        const p = projRows[0];
        contextBlock = `\n\n[PROJECT CONTEXT]\nProject: ${p.name} | Status: ${p.status} | Phase: ${p.phase}
Location: ${p.city}, ${p.country} | Progress: ${p.progress}%
Budget: $${parseFloat(p.budget).toLocaleString()} | Spent: $${parseFloat(p.budget_spent).toLocaleString()}
Tasks: ${p.completed_tasks}/${p.total_tasks} completed | Sensors: ${p.online_sensors}/${p.sensor_count} online\n`;
      }
    }

    // Load conversation history
    const { rows: historyRows } = await db.query(
      'SELECT role, content FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 30',
      [conversationId]
    );

    // Save user message
    await db.query(
      'INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [conversationId, 'user', content]
    );

    // Build messages array for Claude
    const messages = historyRows.map(m => ({ role: m.role, content: m.content }));
    messages.push({ role: 'user', content: content + contextBlock });

    // Call Claude
    const response = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages,
    });

    const assistantContent = response.content[0].text;
    const tokensUsed       = response.usage.input_tokens + response.usage.output_tokens;

    // Save assistant message
    const { rows: savedMsg } = await db.query(
      'INSERT INTO ai_messages (conversation_id, role, content, tokens_used) VALUES ($1, $2, $3, $4) RETURNING *',
      [conversationId, 'assistant', assistantContent, tokensUsed]
    );

    // Update conversation timestamp
    await db.query('UPDATE ai_conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);

    res.json({ success: true, data: savedMsg[0] });
  } catch (err) {
    console.error('[AI] sendMessage error:', err.message);
    res.status(500).json({ success: false, message: 'AI service unavailable. Please try again.' });
  }
}

module.exports = { getConversations, createConversation, getMessages, sendMessage };
