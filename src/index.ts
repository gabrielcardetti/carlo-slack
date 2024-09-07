import { SlackApp, SlackEdgeAppEnv, SlackAppContext, AppMentionEvent, SlackAppContextWithOptionalRespond } from "slack-cloudflare-workers";
import { createWorkersAI } from 'workers-ai-provider';
import { generateText } from 'ai';
import { createSlackMessage, formatTicketForSlack } from "./utils";


// Set to true to automatically update the message with the result of the action if is false it will create a new message instead of updating the existing one
const autoUpdateMessageInAction = true;

export interface Env extends SlackEdgeAppEnv {
  AI: any;
}

interface SlackMessage {
  text: string;
  ts?: string;
  thread_ts?: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    if (request.method === 'GET' && new URL(request.url).pathname === '/health') {
      return new Response('Bot server is up', { status: 200 });
    }

    const app = new SlackApp({ env });

    app.event("app_mention", async ({ context, payload }) => {
      if (payload.thread_ts) {
        await handleThreadMention(context, payload, env);
      } else {
        await handleDirectMention(context, payload);
      }
    });

    app.action('create_linear_ticket',
      async ({ context, payload }) => {

        // await processLinearTicket(context);

      },
      async ({ context, payload }) => {
        const thread = payload.container.thread_ts
        await processLinearTicket(context, thread);
      }
    );

    return await app.run(request, ctx);
  },
};

async function handleThreadMention(context: any, payload: AppMentionEvent, env: Env): Promise<void> {
  const result = await context.client.conversations.replies({
    channel: context.channelId,
    ts: payload.thread_ts,
  });

  if (result.messages && result.messages.length > 0) {
    await createAndPostTicket(result.messages as SlackMessage[], env, context, payload);
  }
}

async function handleDirectMention(context: SlackAppContext, payload: AppMentionEvent): Promise<void> {
  await context.client.chat.postMessage({
    channel: context.channelId!,
    text: `:wave: <@${payload.user}> Como te puedo ayudar??`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:wave: <@${payload.user}> Como te puedo ayudar??`,
        }
      },
    ],
  });
}

async function createTicket(messages: SlackMessage[], env: Env): Promise<string> {
  const workersai = createWorkersAI({ binding: env.AI });

  const model = workersai('@cf/meta/llama-3.1-8b-instruct', {
    safePrompt: true,
  });

  const summary = formatThreadSummary(messages);

  const prompt = `
        Eres un asistente experto en crear tickets a partir de conversaciones de Slack. Tu tarea es analizar el siguiente hilo de Slack y generar un ticket estructurado. El ticket debe incluir:

        1. Título: Un título conciso y descriptivo basado en el tema principal del hilo.
        2. Descripción: Un resumen claro del problema o tarea discutida en el hilo.
        3. Acciones: Una lista de pasos accionables o tareas específicas identificadas en la conversación.

        Aquí está el hilo de Slack:

        ${summary}

        Por favor, genera el ticket en formato JSON con la siguiente estructura:
        
        
        
        {
        "title": "[Título del ticket]",
        "description": "[Descripción del problema o tarea]",
        "actions": [
            "[Acción 1]",
            "[Acción 2]",
            "[Acción 3]",
            ...
            ]
        }

        Asegúrate de capturar la esencia del problema y proporcionar acciones claras y específicas basadas en la discusión del hilo.
        No devuelvas otra cosa que no sea el ticket en formato JSON.
    `;


  const result = await generateText({
    model,
    messages: [{ role: 'user', content: prompt }],
  });

  return result.text;
}

function formatThreadSummary(messages: SlackMessage[]): string {
  if (messages.length === 0) {
    return "No messages in this thread.";
  }

  let summary = `*Hilo Completo:*\n`;

  const messageSummaries = messages.map((msg, index) => {
    return `${index + 1}. ${msg.text}`;
  });

  summary += messageSummaries.join('\n');

  return summary;
}

async function createAndPostTicket(messages: SlackMessage[], env: Env, context: SlackAppContext, payload: AppMentionEvent): Promise<void> {
  try {
    const ticketText = await createTicket(messages, env);
    const formattedTicket = formatTicketForSlack(ticketText);
    const slackMessage = createSlackMessage(formattedTicket);

    await context.client.chat.postMessage({
      channel: context.channelId!,
      thread_ts: payload.thread_ts,
      text: `Nuevo ticket generado a partir de la conversación:`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: slackMessage,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "Create Linear Ticket",
                emoji: true
              },
              value: "create_linear_ticket",
              action_id: "create_linear_ticket"
            }
          ]
        }
      ],
    });
  } catch (error) {
    console.error('Error creating and posting ticket:', error);
    await context.client.chat.postMessage({
      channel: context.channelId!,
      thread_ts: payload.thread_ts,
      text: "Ocurrió un error al generar el ticket. Por favor intenta de nuevo.",
    });
  }
}

async function processLinearTicket(context: SlackAppContextWithOptionalRespond, thread?: string): Promise<void> {
  const { respond } = context;
  if (!respond) {
    console.error('No respond function available in context');
    return;
  }
  try {
    if (thread && !autoUpdateMessageInAction) {
      await context.client.chat.postMessage({
        channel: context.channelId!,
        thread_ts: thread,
        text: `Creando ticket en Linear...`,
      });
    } else {
      await respond({ text: "Creando ticket en Linear..." });
    }


    await sleep(3); // Simulating ticket creation process

    if (thread && !autoUpdateMessageInAction) {
      await context.client.chat.postMessage({
        channel: context.channelId!,
        thread_ts: thread,
        text: `Ticket creado en Linear exitosamente :white_check_mark:`,
      });
    } else {
      await respond({ text: "Ticket creado en Linear exitosamente :white_check_mark:" });
    }
  } catch (error) {
    console.error('Error processing Linear ticket:', error);
    await respond({ text: "Ocurrió un error al crear el ticket en Linear. Por favor intenta de nuevo." });
  }
}

const sleep = (seconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}