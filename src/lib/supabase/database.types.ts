export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          agrees_with_official: boolean | null;
          ai_answer_label: string | null;
          ai_confidence: string | null;
          created_at: string;
          id: string;
          model: string;
          prompt_version: string;
          provider: string;
          question_id: string;
          question_task: string | null;
          result: NonNullable<Json>;
          user_id: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          agrees_with_official?: boolean | null;
          ai_answer_label?: string | null;
          ai_confidence?: string | null;
          created_at?: string;
          id?: string;
          model: string;
          prompt_version: string;
          provider: string;
          question_id: string;
          question_task?: string | null;
          result: NonNullable<Json>;
          user_id?: string;
          version: number;
        };
        Update: {
          agrees_with_official?: boolean | null;
          ai_answer_label?: string | null;
          ai_confidence?: string | null;
          created_at?: string;
          id?: string;
          model?: string;
          prompt_version?: string;
          provider?: string;
          question_id?: string;
          question_task?: string | null;
          result?: NonNullable<Json>;
          user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ai_analyses_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_generation_jobs: {
        Row: {
          created_at: string;
          error: string | null;
          finished_at: string | null;
          id: string;
          input_tokens: number | null;
          job_type: string;
          model: string | null;
          output_tokens: number | null;
          provider: string | null;
          question_id: string | null;
          status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          input_tokens?: number | null;
          job_type: string;
          model?: string | null;
          output_tokens?: number | null;
          provider?: string | null;
          question_id?: string | null;
          status?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          input_tokens?: number | null;
          job_type?: string;
          model?: string | null;
          output_tokens?: number | null;
          provider?: string | null;
          question_id?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_generation_jobs_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      answer_choices: {
        Row: {
          id: string;
          label: string;
          position: number;
          question_id: string;
          text: string;
        };
        ComputedFields: never;
        Insert: {
          id?: string;
          label: string;
          position: number;
          question_id: string;
          text: string;
        };
        Update: {
          id?: string;
          label?: string;
          position?: number;
          question_id?: string;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "answer_choices_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      case_attempts: {
        Row: {
          case_id: string;
          created_at: string;
          id: string;
          is_correct: boolean | null;
          selected_label: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          case_id: string;
          created_at?: string;
          id?: string;
          is_correct?: boolean | null;
          selected_label?: string | null;
          user_id?: string;
        };
        Update: {
          case_id?: string;
          created_at?: string;
          id?: string;
          is_correct?: boolean | null;
          selected_label?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "case_attempts_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "clinical_cases";
            referencedColumns: ["id"];
          },
        ];
      };
      clinical_cases: {
        Row: {
          content: NonNullable<Json>;
          created_at: string;
          difficulty: string;
          id: string;
          source_question_id: string | null;
          topic_id: number | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          content: NonNullable<Json>;
          created_at?: string;
          difficulty: string;
          id?: string;
          source_question_id?: string | null;
          topic_id?: number | null;
          user_id?: string;
        };
        Update: {
          content?: NonNullable<Json>;
          created_at?: string;
          difficulty?: string;
          id?: string;
          source_question_id?: string | null;
          topic_id?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinical_cases_source_question_id_fkey";
            columns: ["source_question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clinical_cases_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "medical_topics";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_profiles: {
        Row: {
          description: string;
          id: string;
          name: string;
          question_style: string;
          region: string;
          scope_notes: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          description: string;
          id: string;
          name: string;
          question_style: string;
          region: string;
          scope_notes: string;
          sort_order?: number;
        };
        Update: {
          description?: string;
          id?: string;
          name?: string;
          question_style?: string;
          region?: string;
          scope_notes?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      flashcard_decks: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_default: boolean;
          name: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_default?: boolean;
          name: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_default?: boolean;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      flashcard_reviews: {
        Row: {
          difficulty_after: number;
          due_before: string;
          duration_ms: number | null;
          flashcard_id: string;
          id: string;
          next_due: string;
          rating: number;
          retrievability_before: number | null;
          reviewed_at: string;
          scheduled_days: number;
          stability_after: number;
          state_before: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          difficulty_after: number;
          due_before: string;
          duration_ms?: number | null;
          flashcard_id: string;
          id?: string;
          next_due: string;
          rating: number;
          retrievability_before?: number | null;
          reviewed_at?: string;
          scheduled_days: number;
          stability_after: number;
          state_before: number;
          user_id?: string;
        };
        Update: {
          difficulty_after?: number;
          due_before?: string;
          duration_ms?: number | null;
          flashcard_id?: string;
          id?: string;
          next_due?: string;
          rating?: number;
          retrievability_before?: number | null;
          reviewed_at?: string;
          scheduled_days?: number;
          stability_after?: number;
          state_before?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey";
            columns: ["flashcard_id"];
            isOneToOne: false;
            referencedRelation: "flashcards";
            referencedColumns: ["id"];
          },
        ];
      };
      flashcards: {
        Row: {
          back: string;
          card_type: string;
          created_at: string;
          deck_id: string;
          explanation: string | null;
          front: string;
          front_normalized: string | null;
          id: string;
          origin: string;
          personal_note: string | null;
          question_id: string | null;
          search: unknown;
          suspended: boolean;
          tags: string[];
          topic_id: number | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          back: string;
          card_type: string;
          created_at?: string;
          deck_id: string;
          explanation?: string | null;
          front: string;
          front_normalized?: never;
          id?: string;
          origin?: string;
          personal_note?: string | null;
          question_id?: string | null;
          search?: never;
          suspended?: boolean;
          tags?: string[];
          topic_id?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          back?: string;
          card_type?: string;
          created_at?: string;
          deck_id?: string;
          explanation?: string | null;
          front?: string;
          front_normalized?: never;
          id?: string;
          origin?: string;
          personal_note?: string | null;
          question_id?: string | null;
          search?: never;
          suspended?: boolean;
          tags?: string[];
          topic_id?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "flashcard_decks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flashcards_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flashcards_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "medical_topics";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_references: {
        Row: {
          created_at: string;
          guideline_version: string | null;
          id: string;
          license: string;
          published_on: string | null;
          publisher: string | null;
          reviewed_on: string | null;
          title: string;
          url: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          guideline_version?: string | null;
          id?: string;
          license: string;
          published_on?: string | null;
          publisher?: string | null;
          reviewed_on?: string | null;
          title: string;
          url?: string | null;
        };
        Update: {
          created_at?: string;
          guideline_version?: string | null;
          id?: string;
          license?: string;
          published_on?: string | null;
          publisher?: string | null;
          reviewed_on?: string | null;
          title?: string;
          url?: string | null;
        };
        Relationships: [];
      };
      medical_topics: {
        Row: {
          id: number;
          kind: string;
          name: string;
          parent_id: number | null;
          slug: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          id?: number;
          kind: string;
          name: string;
          parent_id?: number | null;
          slug: string;
          sort_order?: number;
        };
        Update: {
          id?: number;
          kind?: string;
          name?: string;
          parent_id?: number | null;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "medical_topics_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "medical_topics";
            referencedColumns: ["id"];
          },
        ];
      };
      note_links: {
        Row: {
          note_id: string;
          question_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          note_id: string;
          question_id: string;
          user_id?: string;
        };
        Update: {
          note_id?: string;
          question_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_links_note_id_fkey";
            columns: ["note_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_links_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          note_type: string;
          origin: string;
          parent_id: string | null;
          pinned: boolean;
          question_id: string | null;
          search: unknown;
          tags: string[];
          title: string;
          topic_id: number | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string;
          created_at?: string;
          id?: string;
          note_type?: string;
          origin?: string;
          parent_id?: string | null;
          pinned?: boolean;
          question_id?: string | null;
          search?: never;
          tags?: string[];
          title: string;
          topic_id?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          note_type?: string;
          origin?: string;
          parent_id?: string | null;
          pinned?: boolean;
          question_id?: string | null;
          search?: never;
          tags?: string[];
          title?: string;
          topic_id?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "notes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "medical_topics";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          channel: string;
          id: string;
          kind: string;
          read_at: string | null;
          scheduled_for: string;
          sent_at: string | null;
          title: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string | null;
          channel: string;
          id?: string;
          kind: string;
          read_at?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          title: string;
          user_id?: string;
        };
        Update: {
          body?: string | null;
          channel?: string;
          id?: string;
          kind?: string;
          read_at?: string | null;
          scheduled_for?: string;
          sent_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          exam_date: string | null;
          id: string;
          onboarded_at: string | null;
          target_exam_id: string | null;
          timezone: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string | null;
          exam_date?: string | null;
          id: string;
          onboarded_at?: string | null;
          target_exam_id?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          exam_date?: string | null;
          id?: string;
          onboarded_at?: string | null;
          target_exam_id?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_target_exam_id_fkey";
            columns: ["target_exam_id"];
            isOneToOne: false;
            referencedRelation: "exam_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      question_attempts: {
        Row: {
          confidence: string | null;
          created_at: string;
          graded_against: string | null;
          id: string;
          is_correct: boolean | null;
          mode: string;
          question_id: string;
          selected_label: string | null;
          time_spent_seconds: number | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          confidence?: string | null;
          created_at?: string;
          graded_against?: string | null;
          id?: string;
          is_correct?: boolean | null;
          mode?: string;
          question_id: string;
          selected_label?: string | null;
          time_spent_seconds?: number | null;
          user_id?: string;
        };
        Update: {
          confidence?: string | null;
          created_at?: string;
          graded_against?: string | null;
          id?: string;
          is_correct?: boolean | null;
          mode?: string;
          question_id?: string;
          selected_label?: string | null;
          time_spent_seconds?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          content_hash: string;
          created_at: string;
          difficulty: string | null;
          exam_profile_id: string;
          id: string;
          official_answer_label: string | null;
          review_status: string;
          search: unknown;
          source_note: string | null;
          stem: string;
          topic_id: number | null;
          topic_source: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          content_hash: string;
          created_at?: string;
          difficulty?: string | null;
          exam_profile_id: string;
          id?: string;
          official_answer_label?: string | null;
          review_status?: string;
          search?: never;
          source_note?: string | null;
          stem: string;
          topic_id?: number | null;
          topic_source?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          content_hash?: string;
          created_at?: string;
          difficulty?: string | null;
          exam_profile_id?: string;
          id?: string;
          official_answer_label?: string | null;
          review_status?: string;
          search?: never;
          source_note?: string | null;
          stem?: string;
          topic_id?: number | null;
          topic_source?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_exam_profile_id_fkey";
            columns: ["exam_profile_id"];
            isOneToOne: false;
            referencedRelation: "exam_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "medical_topics";
            referencedColumns: ["id"];
          },
        ];
      };
      review_schedules: {
        Row: {
          difficulty: number;
          due: string;
          elapsed_days: number;
          flashcard_id: string;
          lapses: number;
          last_review: string | null;
          learning_steps: number;
          reps: number;
          scheduled_days: number;
          stability: number;
          state: number;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          difficulty?: number;
          due?: string;
          elapsed_days?: number;
          flashcard_id: string;
          lapses?: number;
          last_review?: string | null;
          learning_steps?: number;
          reps?: number;
          scheduled_days?: number;
          stability?: number;
          state?: number;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          difficulty?: number;
          due?: string;
          elapsed_days?: number;
          flashcard_id?: string;
          lapses?: number;
          last_review?: string | null;
          learning_steps?: number;
          reps?: number;
          scheduled_days?: number;
          stability?: number;
          state?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_schedules_flashcard_id_fkey";
            columns: ["flashcard_id"];
            isOneToOne: true;
            referencedRelation: "flashcards";
            referencedColumns: ["id"];
          },
        ];
      };
      study_preferences: {
        Row: {
          browser_reminders: boolean;
          daily_minutes: number;
          desired_retention: number;
          email_reminders: boolean;
          max_new_cards_per_day: number;
          study_days: number[];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          browser_reminders?: boolean;
          daily_minutes?: number;
          desired_retention?: number;
          email_reminders?: boolean;
          max_new_cards_per_day?: number;
          study_days?: number[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          browser_reminders?: boolean;
          daily_minutes?: number;
          desired_retention?: number;
          email_reminders?: boolean;
          max_new_cards_per_day?: number;
          study_days?: number[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: {
          ended_at: string | null;
          id: string;
          items_completed: number;
          kind: string;
          started_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          ended_at?: string | null;
          id?: string;
          items_completed?: number;
          kind: string;
          started_at?: string;
          user_id?: string;
        };
        Update: {
          ended_at?: string | null;
          id?: string;
          items_completed?: number;
          kind?: string;
          started_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_feedback: {
        Row: {
          analysis_id: string | null;
          created_at: string;
          id: string;
          kind: string;
          message: string;
          question_id: string | null;
          reviewer_note: string | null;
          section: string | null;
          status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          analysis_id?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          message: string;
          question_id?: string | null;
          reviewer_note?: string | null;
          section?: string | null;
          status?: string;
          user_id?: string;
        };
        Update: {
          analysis_id?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          message?: string;
          question_id?: string | null;
          reviewer_note?: string | null;
          section?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_feedback_analysis_id_fkey";
            columns: ["analysis_id"];
            isOneToOne: false;
            referencedRelation: "ai_analyses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_feedback_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      activity_days: {
        Args: { p_days?: number; p_tz?: string };
        Returns: {
          day: string;
        }[];
      };
      daily_activity: {
        Args: { p_days?: number; p_tz?: string };
        Returns: {
          analyzed: number;
          attempts: number;
          correct: number;
          day: string;
          graded: number;
          reviews: number;
        }[];
      };
      find_similar_questions: {
        Args: { p_limit?: number; p_stem: string };
        Returns: {
          created_at: string;
          id: string;
          similarity: number;
          stem: string;
        }[];
      };
      topic_performance: {
        Args: Record<PropertyKey, never>;
        Returns: {
          accuracy: number;
          attempts: number;
          correct: number;
          questions: number;
          topic_id: number;
          topic_name: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
