'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a summary of the differences between two images.
 *
 * - generateDifferenceSummary - A function that takes two image data URIs as input and returns a text summary of the differences between them.
 * - GenerateDifferenceSummaryInput - The input type for the generateDifferenceSummary function.
 * - GenerateDifferenceSummaryOutput - The return type for the generateDifferenceSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDifferenceSummaryInputSchema = z.object({
  image1DataUri: z
    .string()
    .describe(
      "A photo of the first image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  image2DataUri: z
    .string()
    .describe(
      "A photo of the second image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type GenerateDifferenceSummaryInput = z.infer<typeof GenerateDifferenceSummaryInputSchema>;

const GenerateDifferenceSummaryOutputSchema = z.object({
  summary: z.string().describe('A text summary of the differences between the two images.'),
});

export type GenerateDifferenceSummaryOutput = z.infer<typeof GenerateDifferenceSummaryOutputSchema>;

export async function generateDifferenceSummary(
  input: GenerateDifferenceSummaryInput
): Promise<GenerateDifferenceSummaryOutput> {
  return generateDifferenceSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDifferenceSummaryPrompt',
  input: {schema: GenerateDifferenceSummaryInputSchema},
  output: {schema: GenerateDifferenceSummaryOutputSchema},
  prompt: `You are an expert image analyst. You are given two images and you need to provide a concise summary of the differences between them.

  Image 1: {{media url=image1DataUri}}
  Image 2: {{media url=image2DataUri}}

  Focus on the key differences that a user would immediately notice. Be specific about the types of changes and their locations within the images.
`,
});

const generateDifferenceSummaryFlow = ai.defineFlow(
  {
    name: 'generateDifferenceSummaryFlow',
    inputSchema: GenerateDifferenceSummaryInputSchema,
    outputSchema: GenerateDifferenceSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
