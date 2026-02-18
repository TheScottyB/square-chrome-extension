export type RuntimeMode = 'WEB_SAFE' | 'LOCAL_STANDARD' | 'LOCAL_PRIVILEGED';

export interface ExtensionRuntimeCapabilities {
  filesystem_full_access: boolean;
  photos_full_access: boolean;
  chrome_control: boolean;
  js_injection: boolean;
  mcp_local_tools: boolean;
  network_access: boolean;
}

export interface ExtensionRuntimeProfile {
  runtimeId: string;
  mode: RuntimeMode;
  capabilities: ExtensionRuntimeCapabilities;
}

export type ScriptActionName =
  | 'getPageInfo'
  | 'extractItemFields'
  | 'setSeoFields'
  | 'clickSelector'
  | 'insertCssClass';

export interface ExtractItemFieldsPayload {
  nameSelector?: string;
  priceSelector?: string;
  descriptionSelector?: string;
}

export interface SetSeoFieldsPayload {
  title?: string;
  description?: string;
  titleSelector?: string;
  descriptionSelector?: string;
}

export interface ClickSelectorPayload {
  selector: string;
}

export interface InsertCssClassPayload {
  selector: string;
  className: string;
}

export type ScriptActionPayload =
  | Record<string, never>
  | ExtractItemFieldsPayload
  | SetSeoFieldsPayload
  | ClickSelectorPayload
  | InsertCssClassPayload;

export interface ScriptActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export const DEFAULT_RUNTIME_PROFILE: ExtensionRuntimeProfile = {
  runtimeId: 'unknown',
  mode: 'WEB_SAFE',
  capabilities: {
    filesystem_full_access: false,
    photos_full_access: false,
    chrome_control: false,
    js_injection: false,
    mcp_local_tools: true,
    network_access: true
  }
};
