// Hand-written Supabase database types. Verified against live schema on
// 2026-05-16 (project xfazrcthcildzqxuerhv). Kept hand-written rather than
// generated because the generated output widens enum columns to `string`,
// losing the 'CAD' | 'USD' / 'BUY' | 'SELL' / severity unions that the rest
// of the app depends on. Regenerate from `mcp__supabase__generate_typescript_types`
// only if the schema changes; merge by hand to preserve the literal unions.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          starting_balance_cad: number;
          cash_cad: number;
          realized_gain_loss_cad: number;
          base_currency: 'CAD';
          market_data_mode: 'API' | 'MOCK';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          starting_balance_cad?: number;
          cash_cad?: number;
          realized_gain_loss_cad?: number;
          base_currency?: 'CAD';
          market_data_mode?: 'API' | 'MOCK';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['portfolios']['Insert']>;
        Relationships: [];
      };
      holdings: {
        Row: {
          id: string;
          portfolio_id: string;
          user_id: string;
          symbol: string;
          asset_name: string;
          asset_type: 'STOCK' | 'ETF';
          exchange: string | null;
          sector: string | null;
          quantity: number;
          average_cost_cad: number;
          current_price_native: number | null;
          current_price_cad: number | null;
          native_currency: 'CAD' | 'USD';
          fx_rate_to_cad: number;
          last_quote_at: string | null;
          quote_freshness: string | null;
          first_purchase_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['holdings']['Row'],
          'id' | 'created_at' | 'updated_at'
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['holdings']['Insert']>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          portfolio_id: string;
          user_id: string;
          type: 'BUY' | 'SELL';
          symbol: string;
          asset_name: string;
          asset_type: 'STOCK' | 'ETF';
          quantity: number;
          price_native: number;
          native_currency: 'CAD' | 'USD';
          fx_rate_to_cad: number;
          price_cad: number;
          total_cad: number;
          realized_gain_loss_cad: number | null;
          quote_timestamp: string;
          purchase_date: string;
          is_time_traveled: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['transactions']['Row'],
          'id' | 'created_at' | 'is_time_traveled'
        > & {
          id?: string;
          created_at?: string;
          is_time_traveled?: boolean;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
        Relationships: [];
      };
      portfolio_snapshots: {
        Row: {
          id: string;
          portfolio_id: string;
          user_id: string;
          total_value_cad: number;
          cash_cad: number;
          invested_value_cad: number;
          total_return_cad: number;
          total_return_percent: number;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['portfolio_snapshots']['Row'],
          'id' | 'created_at'
        > & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['portfolio_snapshots']['Insert']
        >;
        Relationships: [];
      };
      risk_warnings: {
        Row: {
          id: string;
          portfolio_id: string;
          user_id: string;
          type: string;
          severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH';
          title: string;
          message: string;
          related_symbol: string | null;
          related_learning_slugs: string[];
          acknowledged: boolean;
          created_at: string;
          acknowledged_at: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['risk_warnings']['Row'],
          | 'id'
          | 'created_at'
          | 'related_learning_slugs'
          | 'acknowledged'
          | 'acknowledged_at'
        > & {
          id?: string;
          created_at?: string;
          related_learning_slugs?: string[];
          acknowledged?: boolean;
          acknowledged_at?: string | null;
        };
        Update: Partial<
          Database['public']['Tables']['risk_warnings']['Insert']
        >;
        Relationships: [];
      };
      learning_progress: {
        Row: {
          id: string;
          user_id: string;
          term_slug: string;
          viewed: boolean;
          viewed_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['learning_progress']['Row'],
          'id' | 'viewed_at' | 'viewed'
        > & {
          id?: string;
          viewed_at?: string;
          viewed?: boolean;
        };
        Update: Partial<
          Database['public']['Tables']['learning_progress']['Insert']
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
