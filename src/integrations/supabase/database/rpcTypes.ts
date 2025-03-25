
import { Database } from '../types';

// Extend Database type with our custom RPCs
export type ExtendedDatabase = Database & {
  public: {
    Functions: {
      set_user_context: {
        Args: {
          user_id: string;
        };
        Returns: void;
      };
      fill_actual_hours: {
        Args: {
          p_version_id: string;
          p_year: string;
        };
        Returns: void;
      };
    };
  };
};
