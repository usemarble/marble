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
  createdAt: Date;
  updatedAt: Date;
}
