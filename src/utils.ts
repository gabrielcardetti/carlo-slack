interface FormattedTicket {
  title: string;
  description: string;
  actions: string[];
}

export function formatTicketForSlack(ticketText: string): FormattedTicket {
  try {
    const ticket = JSON.parse(ticketText);
    return {
      title: ticket.title,
      description: ticket.description,
      actions: ticket.actions
    };
  } catch (error) {
    throw new Error('Invalid ticket format');
  }

}

export function createSlackMessage(ticket: FormattedTicket): string {
  console.log(ticket);
  const formattedMessage = [
    `*🎫 🎫 🎫*`,
    `*Titulo:* ${ticket.title}`,
    ``,
    `*Descripcion:*`,
    ticket.description,
    ``,
    `*Acciones:*`,
    ...ticket.actions.map(action => `• ${action}`),
    ``,
  ].join('\n');

  return formattedMessage;
}