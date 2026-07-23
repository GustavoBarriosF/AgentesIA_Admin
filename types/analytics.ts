export interface AnalyticsOverview {
  total_conversations: number;
  by_status: {
    open: number;
    resolved: number;
    abandoned: number;
  };
  avg_first_response_time_s: number;
  avg_resolution_time_s: number;
  avg_csat_score: number;
  total_messages: number;
  bot_escalation_rate: number; // 0-1
  by_channel: {
    channel_id: string;
    channel_name: string;
    type: string;
    count: number;
  }[];
  by_agent: {
    agent_id: string;
    agent_name: string;
    conversations: number;
    avg_resolution_s: number;
    csat_avg: number;
  }[];
}

export interface AnalyticsDateRange {
  from: string; // ISO 8601
  to: string;   // ISO 8601
}

export interface TokenUsageByModel {
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  message_count: number;
  avg_input_per_msg: number;
  avg_output_per_msg: number;
}

export interface TokenUsage {
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  conversations_with_ai: number;
  avg_input_tokens_per_conv: number;
  avg_output_tokens_per_conv: number;
  avg_total_tokens_per_conv: number;
  by_model: TokenUsageByModel[];
}
