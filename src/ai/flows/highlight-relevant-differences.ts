'use server';

/**
 * @fileOverview This file contains a Genkit flow that highlights the most relevant differences between two images.
 *
 * - highlightRelevantDifferences - A function that takes two image data URIs and returns a data URI of the comparison image with highlighted differences.
 * - HighlightRelevantDifferencesInput - The input type for the highlightRelevantDifferences function.
 * - HighlightRelevantDifferencesOutput - The return type for the highlightRelevantDifferences function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HighlightRelevantDifferencesInputSchema = z.object({
  image1DataUri: z
    .string()
    .describe(
      "The first image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  image2DataUri: z
    .string()
    .describe(
      "The second image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type HighlightRelevantDifferencesInput = z.infer<typeof HighlightRelevantDifferencesInputSchema>;

const HighlightRelevantDifferencesOutputSchema = z.object({
  comparisonImage: z
    .string()
    .describe(
      'A data URI of the comparison image with highlighted differences, using bounding boxes and color overlays.'
    ),
});
export type HighlightRelevantDifferencesOutput = z.infer<typeof HighlightRelevantDifferencesOutputSchema>;

export async function highlightRelevantDifferences(
  input: HighlightRelevantDifferencesInput
): Promise<HighlightRelevantDifferencesOutput> {
  return highlightRelevantDifferencesFlow(input);
}

const highlightRelevantDifferencesPrompt = ai.definePrompt({
  name: 'highlightRelevantDifferencesPrompt',
  input: {schema: HighlightRelevantDifferencesInputSchema},
  output: {schema: HighlightRelevantDifferencesOutputSchema},
  prompt: `You are an AI that specializes in identifying and highlighting the most relevant differences between two images. Analyze the two provided images and generate a new image that visually emphasizes the key discrepancies using bounding boxes and color overlays.

  Image 1: {{media url=image1DataUri}}
  Image 2: {{media url=image2DataUri}}

  Ensure the output focuses on significant changes, avoiding minor or irrelevant details to provide a clear and concise comparison. Return the comparison image as a data URI.
  `,
});

const highlightRelevantDifferencesFlow = ai.defineFlow(
  {
    name: 'highlightRelevantDifferencesFlow',
    inputSchema: HighlightRelevantDifferencesInputSchema,
    outputSchema: HighlightRelevantDifferencesOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {text: highlightRelevantDifferencesPrompt.prompt(input).prompt},
        {media: {url: input.image1DataUri}},
        {media: {url: input.image2DataUri}},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    return {comparisonImage: media!.url!};
  }
);
