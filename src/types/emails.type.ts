export type TEmailTemplate = {
  id: string;
  variables: Record<string, unknown>;
};

export type TAttachment = {
  path: string;
  filename: string;
};

export type TEmailConfig = {
  unsubscribeUrl?: string;
};

export type TTemplateEmailSend = {
  to: string;
  template: {
    id: string;
    variables: Record<string, string | number>;
  };
  attachments: {
    path: string;
    filename: string;
  }[];
  idempotencyKey?: string;
  scheduledAt?: string;
  unsubscribeUrl?: string;
};
