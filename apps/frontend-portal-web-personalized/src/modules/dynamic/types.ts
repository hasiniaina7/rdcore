export type DynamicLanguage = {
  id: string;
  value: string;
};

export type DynamicGalleryItem = {
  file_name?: string;
  layout?: string;
  width?: number;
  height?: number;
};

export type DynamicPage = {
  title?: string;
  content?: string;
};

export type DynamicClientInfo = {
  userAgent?: string;
  isMobile?: boolean;
  [key: string]: unknown;
};

export type DynamicSettings = {
  show_logo?: boolean;
  show_name?: boolean;
  name_colour?: string;
  show_screen_delay?: number;
  available_languages?: DynamicLanguage[];
  social_login?: {
    active?: boolean;
    temp_username?: string;
    temp_password?: string;
    items?: { name: string; display_name?: string }[];
  };
  click_to_connect?: ClickToConnectConfig;
  user_login_check?: boolean;
  voucher_login_check?: boolean;
  auto_suffix_check?: boolean;
  auto_suffix?: string;
  usage_show_check?: boolean;
  connect_check?: boolean;
  connect_only?: boolean;
  [key: string]: unknown;
};

export type DynamicDetail = {
  detail?: Record<string, unknown>;
  settings?: DynamicSettings;
  photos?: DynamicGalleryItem[];
  pages?: DynamicPage[];
  client_info?: DynamicClientInfo;
  gallery?: DynamicGalleryItem[];
  [key: string]: unknown;
};

export type DynamicDetailApiResponse = {
  success: boolean;
  data: DynamicDetail | null;
  message?: string;
};

export type AvailableKeyPair = {
  label: string;
  value: string;
};

export type ClickToConnectConfig = {
  connect_check?: boolean;
  connect_username?: string;
  connect_suffix?: string;
  connect_delay?: number;
  button_title?: string;
  [key: string]: unknown;
};
