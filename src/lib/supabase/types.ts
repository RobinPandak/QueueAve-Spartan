// Auto-generated types for Spartan schema.
// Regenerate after applying DB schema:
// npx supabase gen types typescript --project-id orbbqanrphfbkcwyrkeo > src/lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      spartan_events: {
        Row: {
          id: string
          organizer_id: string
          name: string
          date: string
          venue: string | null
          description: string | null
          status: 'draft' | 'open' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          name: string
          date: string
          venue?: string | null
          description?: string | null
          status?: 'draft' | 'open' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          name?: string
          date?: string
          venue?: string | null
          description?: string | null
          status?: 'draft' | 'open' | 'completed'
          created_at?: string
        }
      }
      spartan_groups: {
        Row: {
          id: string
          event_id: string
          name: string
          start_time: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          start_time?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          start_time?: string | null
          sort_order?: number
        }
      }
      spartan_participants: {
        Row: {
          id: string
          event_id: string
          group_id: string | null
          name: string
          registered_at: string
          checked_in: boolean
          checked_in_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          group_id?: string | null
          name: string
          registered_at?: string
          checked_in?: boolean
          checked_in_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          group_id?: string | null
          name?: string
          registered_at?: string
          checked_in?: boolean
          checked_in_at?: string | null
        }
      }
      spartan_session_templates: {
        Row: {
          id: string
          event_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          created_at?: string
        }
      }
      spartan_metrics: {
        Row: {
          id: string
          template_id: string
          name: string
          type: 'time' | 'count' | 'pass_fail'
          unit: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          template_id: string
          name: string
          type: 'time' | 'count' | 'pass_fail'
          unit?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          template_id?: string
          name?: string
          type?: 'time' | 'count' | 'pass_fail'
          unit?: string | null
          sort_order?: number
        }
      }
      spartan_sessions: {
        Row: {
          id: string
          event_id: string
          template_id: string
          group_id: string | null
          session_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          template_id: string
          group_id?: string | null
          session_date: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          template_id?: string
          group_id?: string | null
          session_date?: string
          notes?: string | null
          created_at?: string
        }
      }
      spartan_results: {
        Row: {
          id: string
          session_id: string
          participant_id: string
          metric_id: string
          time_value: string | null
          count_value: number | null
          pass_value: boolean | null
          recorded_at: string
        }
        Insert: {
          id?: string
          session_id: string
          participant_id: string
          metric_id: string
          time_value?: string | null
          count_value?: number | null
          pass_value?: boolean | null
          recorded_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          participant_id?: string
          metric_id?: string
          time_value?: string | null
          count_value?: number | null
          pass_value?: boolean | null
          recorded_at?: string
        }
      }
      organizers: {
        Row: {
          id: string
          email: string | null
          name: string | null
          created_at: string
          is_admin: boolean
        }
        Insert: {
          id?: string
          email?: string | null
          name?: string | null
          created_at?: string
          is_admin?: boolean
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          created_at?: string
          is_admin?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
