import { z } from "zod";

export const modelCalibrationIdParamsSchema = z.object({
  id: z.string().uuid("Calibration run id must be a valid UUID")
});

export const runModelCalibrationSchema = z.object({
  sourceModelVersion: z.string().trim().min(1).optional(),
  targetModelVersion: z.string().trim().min(1).optional(),
  highContributionThreshold: z.number().positive().max(1).default(0.03),
  notes: z.string().trim().max(500).optional()
});

export type RunModelCalibrationInput = z.infer<typeof runModelCalibrationSchema>;
