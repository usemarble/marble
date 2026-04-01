export interface FieldOption {
  id: string;
  fieldId: string;
  workspaceId: string;
  value: string;
  label: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomField {
  id: string;
  name: string;
  description: string | null;
  key: string;
  type:
    | "text"
    | "number"
    | "boolean"
    | "date"
    | "richtext"
    | "select"
    | "multiselect";
  required: boolean;
  position: number;
  hasValues?: boolean;
  options: FieldOption[];
  createdAt: Date;
  updatedAt: Date;
}
