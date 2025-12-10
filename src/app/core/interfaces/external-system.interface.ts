export interface ExternalSystem {
  id: string;
  name: string;
  description?: string;
  url: string;
  icon?: string;
  requiresAuth: boolean;
  allowedRoles?: string[];
  route?: string;
  openInNewTab?: boolean;
  iframeConfig?: {
    allowFullscreen?: boolean;
    sandbox?: string[];
  };
}

export interface ExternalSystemConfig {
  systems: ExternalSystem[];
}

