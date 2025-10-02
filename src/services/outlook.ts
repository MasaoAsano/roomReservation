// Placeholder for Outlook integration (Microsoft Graph API)
// MVP: define interface and a no-op implementation. Wire later with credentials.

export interface OutlookEventInput {
  subject: string;
  startIso: string;
  endIso: string;
  attendeesEmails: string[];
  body?: string;
}

export interface OutlookClient {
  createEvent(input: OutlookEventInput): Promise<{ ok: boolean; eventId?: string; error?: string }>; 
  deleteEvent(eventId: string): Promise<{ ok: boolean; error?: string }>;
}

export class NoopOutlookClient implements OutlookClient {
  async createEvent(_input: OutlookEventInput): Promise<{ ok: boolean; eventId?: string; error?: string }>{
    return { ok: true, eventId: `noop_${Date.now()}` };
  }
  async deleteEvent(_eventId: string): Promise<{ ok: boolean; error?: string }>{
    return { ok: true };
  }
}
