export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string
          expense_id: string | null
          file_name: string
          id: string
          mime_type: string
          organization_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          expense_id?: string | null
          file_name: string
          id?: string
          mime_type: string
          organization_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          expense_id?: string | null
          file_name?: string
          id?: string
          mime_type?: string
          organization_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          organization_id: string
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id: string
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          id: string
          name: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_roles: {
        Row: {
          id: string
          name: string
          organization_id: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          organization_id: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          created_at: string
          first_name: string
          hired_at: string | null
          id: string
          is_active: boolean
          last_name: string
          monthly_salary: number
          notes: string | null
          organization_id: string
          phone: string | null
          photo_url: string | null
          role_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          first_name: string
          hired_at?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          monthly_salary?: number
          notes?: string | null
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          first_name?: string
          hired_at?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          monthly_salary?: number
          notes?: string | null
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "employee_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          default_nature: Database["public"]["Enums"]["expense_nature"]
          id: string
          is_system: boolean
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          default_nature?: Database["public"]["Enums"]["expense_nature"]
          id?: string
          is_system?: boolean
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          default_nature?: Database["public"]["Enums"]["expense_nature"]
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          cancel_reason: string | null
          category_id: string
          created_at: string
          date: string
          description: string
          id: string
          nature: Database["public"]["Enums"]["expense_nature"]
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          recorded_by: string | null
          recurring_occurrence_id: string | null
          salary_payment_id: string | null
          status: Database["public"]["Enums"]["record_status"]
          supplier: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          cancel_reason?: string | null
          category_id: string
          created_at?: string
          date: string
          description: string
          id?: string
          nature: Database["public"]["Enums"]["expense_nature"]
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          recorded_by?: string | null
          recurring_occurrence_id?: string | null
          salary_payment_id?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          supplier?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          cancel_reason?: string | null
          category_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          nature?: Database["public"]["Enums"]["expense_nature"]
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          recorded_by?: string | null
          recurring_occurrence_id?: string | null
          salary_payment_id?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          supplier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recurring_occurrence_id_fkey"
            columns: ["recurring_occurrence_id"]
            isOneToOne: false
            referencedRelation: "recurring_expense_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_salary_payment_id_fkey"
            columns: ["salary_payment_id"]
            isOneToOne: false
            referencedRelation: "salary_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          period_month: string
          revenue_target: number
          washes_target: number
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          period_month: string
          revenue_target?: number
          washes_target?: number
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          period_month?: string
          revenue_target?: number
          washes_target?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          country: string
          created_at: string
          currency: string
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          timezone: string
        }
        Insert: {
          address?: string | null
          country?: string
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          timezone?: string
        }
        Update: {
          address?: string | null
          country?: string
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          timezone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          organization_id: string
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          organization_id: string
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          organization_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expense_occurrences: {
        Row: {
          due_date: string
          expense_id: string | null
          id: string
          label: string
          organization_id: string
          recurring_expense_id: string
          status: Database["public"]["Enums"]["occurrence_status"]
        }
        Insert: {
          due_date: string
          expense_id?: string | null
          id?: string
          label: string
          organization_id: string
          recurring_expense_id: string
          status?: Database["public"]["Enums"]["occurrence_status"]
        }
        Update: {
          due_date?: string
          expense_id?: string | null
          id?: string
          label?: string
          organization_id?: string
          recurring_expense_id?: string
          status?: Database["public"]["Enums"]["occurrence_status"]
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expense_occurrences_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expense_occurrences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expense_occurrences_recurring_expense_id_fkey"
            columns: ["recurring_expense_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expenses: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          description: string
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id: string
          nature: Database["public"]["Enums"]["expense_nature"]
          next_due_date: string
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          start_date: string
          status: Database["public"]["Enums"]["recurring_status"]
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          description: string
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          nature?: Database["public"]["Enums"]["expense_nature"]
          next_due_date: string
          organization_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          start_date: string
          status?: Database["public"]["Enums"]["recurring_status"]
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          description?: string
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          nature?: Database["public"]["Enums"]["expense_nature"]
          next_due_date?: string
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          start_date?: string
          status?: Database["public"]["Enums"]["recurring_status"]
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_payments: {
        Row: {
          comment: string | null
          created_at: string
          employee_id: string
          expected_amount: number
          id: string
          organization_id: string
          paid_amount: number
          paid_at: string | null
          period_month: string
          status: Database["public"]["Enums"]["salary_status"]
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          employee_id: string
          expected_amount: number
          id?: string
          organization_id: string
          paid_amount?: number
          paid_at?: string | null
          period_month: string
          status?: Database["public"]["Enums"]["salary_status"]
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          employee_id?: string
          expected_amount?: number
          id?: string
          organization_id?: string
          paid_amount?: number
          paid_at?: string | null
          period_month?: string
          status?: Database["public"]["Enums"]["salary_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_prices: {
        Row: {
          id: string
          organization_id: string
          price: number
          service_id: string
          vehicle_type_id: string
        }
        Insert: {
          id?: string
          organization_id: string
          price: number
          service_id: string
          vehicle_type_id: string
        }
        Update: {
          id?: string
          organization_id?: string
          price?: number
          service_id?: string
          vehicle_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_prices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_prices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_prices_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          reference_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          reference_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          reference_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_types: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          organization_id: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string | null
          created_at: string
          customer_id: string | null
          id: string
          model: string | null
          organization_id: string
          plate: string
          vehicle_type_id: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          model?: string | null
          organization_id: string
          plate: string
          vehicle_type_id?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          model?: string | null
          organization_id?: string
          plate?: string
          vehicle_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
      wash_employees: {
        Row: {
          employee_id: string
          id: string
          organization_id: string
          wash_id: string
        }
        Insert: {
          employee_id: string
          id?: string
          organization_id: string
          wash_id: string
        }
        Update: {
          employee_id?: string
          id?: string
          organization_id?: string
          wash_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wash_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_employees_wash_id_fkey"
            columns: ["wash_id"]
            isOneToOne: false
            referencedRelation: "washes"
            referencedColumns: ["id"]
          },
        ]
      }
      wash_services: {
        Row: {
          id: string
          name: string
          organization_id: string
          price: number
          service_id: string | null
          wash_id: string
        }
        Insert: {
          id?: string
          name: string
          organization_id: string
          price: number
          service_id?: string | null
          wash_id: string
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string
          price?: number
          service_id?: string | null
          wash_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wash_services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wash_services_wash_id_fkey"
            columns: ["wash_id"]
            isOneToOne: false
            referencedRelation: "washes"
            referencedColumns: ["id"]
          },
        ]
      }
      washes: {
        Row: {
          business_date: string
          cancel_reason: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number | null
          discount_note: string | null
          discount_reason: Database["public"]["Enums"]["discount_reason"] | null
          final_amount: number
          id: string
          note: string | null
          occurred_at: string
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          plate: string | null
          status: Database["public"]["Enums"]["record_status"]
          theoretical_amount: number
          updated_at: string
          vehicle_id: string | null
          vehicle_type_id: string | null
        }
        Insert: {
          business_date: string
          cancel_reason?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          discount_note?: string | null
          discount_reason?:
            | Database["public"]["Enums"]["discount_reason"]
            | null
          final_amount?: number
          id?: string
          note?: string | null
          occurred_at?: string
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          plate?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          theoretical_amount?: number
          updated_at?: string
          vehicle_id?: string | null
          vehicle_type_id?: string | null
        }
        Update: {
          business_date?: string
          cancel_reason?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          discount_note?: string | null
          discount_reason?:
            | Database["public"]["Enums"]["discount_reason"]
            | null
          final_amount?: number
          id?: string
          note?: string | null
          occurred_at?: string
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          plate?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          theoretical_amount?: number
          updated_at?: string
          vehicle_id?: string | null
          vehicle_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "washes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "washes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "washes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "washes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "washes_vehicle_type_id_fkey"
            columns: ["vehicle_type_id"]
            isOneToOne: false
            referencedRelation: "vehicle_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_due_date: {
        Args: {
          p_date: string
          p_frequency: Database["public"]["Enums"]["recurrence_frequency"]
        }
        Returns: string
      }
      current_org_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      dashboard_kpis: {
        Args: { p_from: string; p_to: string }
        Returns: {
          avg_ticket: number
          cash_collected: number
          expenses: number
          mobile_collected: number
          profit: number
          revenue: number
          wash_count: number
        }[]
      }
      employee_ranking: {
        Args: { p_from: string; p_to: string }
        Returns: {
          employee_id: string
          name: string
          revenue: number
          top_service: string
          wash_count: number
        }[]
      }
      expenses_by_category: {
        Args: { p_from: string; p_to: string }
        Returns: {
          name: string
          value: number
        }[]
      }
      generate_recurring_occurrences: { Args: never; Returns: number }
      global_search: {
        Args: { p_query: string }
        Returns: {
          entity: string
          id: string
          subtitle: string
          title: string
        }[]
      }
      metric_timeseries: {
        Args: { p_from: string; p_metric: string; p_to: string }
        Returns: {
          bucket: string
          value: number
        }[]
      }
      payment_split: {
        Args: { p_from: string; p_to: string }
        Returns: {
          name: string
          value: number
        }[]
      }
      revenue_by_employee: {
        Args: { p_from: string; p_to: string }
        Returns: {
          name: string
          value: number
          wash_count: number
        }[]
      }
      revenue_by_service: {
        Args: { p_from: string; p_to: string }
        Returns: {
          name: string
          value: number
        }[]
      }
      revenue_by_vehicle_type: {
        Args: { p_from: string; p_to: string }
        Returns: {
          name: string
          value: number
        }[]
      }
    }
    Enums: {
      discount_reason:
        | "commercial_discount"
        | "regular_customer"
        | "goodwill"
        | "error"
        | "other"
      expense_nature: "FIXE" | "VARIABLE"
      occurrence_status: "pending" | "confirmed" | "skipped"
      payment_method: "cash" | "mobile_money"
      record_status: "active" | "cancelled"
      recurrence_frequency: "weekly" | "monthly" | "yearly"
      recurring_status: "active" | "paused"
      salary_status: "to_pay" | "partial" | "paid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      discount_reason: [
        "commercial_discount",
        "regular_customer",
        "goodwill",
        "error",
        "other",
      ],
      expense_nature: ["FIXE", "VARIABLE"],
      occurrence_status: ["pending", "confirmed", "skipped"],
      payment_method: ["cash", "mobile_money"],
      record_status: ["active", "cancelled"],
      recurrence_frequency: ["weekly", "monthly", "yearly"],
      recurring_status: ["active", "paused"],
      salary_status: ["to_pay", "partial", "paid"],
    },
  },
} as const
