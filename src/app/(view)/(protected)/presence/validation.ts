import * as z from "zod";

export const presenceFormSchema = z.object({
  date: z.string(),
  time: z.string(),
  note: z.string().optional(),
  // file: z.string().optional(),

  // TODO: need to read condition from API
  type: z.enum(["clock-in", "clock-out"]),

  // TODO: this optional, required when permitted
  // attachment: z.string().optional(),
  // permitReason: z.string().optional(),
});
