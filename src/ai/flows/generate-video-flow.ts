'use server';
/**
 * @fileOverview A Genkit flow for generating a video comparison between two images.
 *
 * - generateComparisonVideo - A function that creates a video showing a wipe transition.
 * - GenerateVideoInput - The input type for the flow.
 * - GenerateVideoOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
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

export async function generateComparisonVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  return generateComparisonVideoFlow(input);
}

const generateComparisonVideoFlow = ai.defineFlow(
  {
    name: 'generateComparisonVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async ({ beforeImage, afterImage }) => {
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: [
        {
          text: 'Create a 5-second video. Start by showing the "after" image for 1 second. Then, perform a 3-second vertical line wipe transition from left to right, revealing the "before" image. Hold on the final "before" image for the remaining 1 second. The video should have a 16:9 aspect ratio.',
        },
        { media: { url: afterImage, ভূমিকা: 'after' } },
        { media: { url: beforeImage, ভূমিকা: 'before' } },
      ],
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });
    
    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }
    
    // Wait until the operation completes.
    while (!operation.done) {
      // This is a long running operation, so we need to poll for completion.
      await new Promise((resolve) => setTimeout(resolve, 5000));
      operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
      throw new Error('failed to generate video: ' + operation.error.message);
    }
    
    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video || !video.media?.url) {
      throw new Error('Failed to find the generated video in the response');
    }

    return {
      videoUrl: video.media.url,
    };
  }
);
