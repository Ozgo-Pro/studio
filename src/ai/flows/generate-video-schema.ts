/**
 * @fileOverview Schemas and types for the video generation flow.
 *
 * - GenerateVideoInputSchema - Zod schema for the video generation input.
 * - GenerateVideoInput - The input type for the flow.
 * - GenerateVideoOutputSchema - Zod schema for the video generation output.
 * - GenerateVideoOutput - The return type for the flow.
 */
import { z } from 'genkit';

export const GenerateVideoInputSchema = z.object({
  beforeImage: z
    .string()
    .describe(
      "The 'before' image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  afterImage: z
    .string()
    .describe(
      "The 'after' image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

export const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated video.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;
