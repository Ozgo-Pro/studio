'use server';
/**
 * @fileOverview A Genkit flow for generating a video comparison between two images.
 *
 * - generateComparisonVideo - A function that creates a video showing a wipe transition.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {
  GenerateVideoInputSchema,
  GenerateVideoOutputSchema,
  type GenerateVideoInput,
  type GenerateVideoOutput,
} from './generate-video-schema';

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
    const beforeImageContentType = beforeImage.match(/data:(.*);base64,/)?.[1];
    const afterImageContentType = afterImage.match(/data:(.*);base64,/)?.[1];

    if (!beforeImageContentType || !afterImageContentType) {
      throw new Error('Could not determine image content type from data URI.');
    }
    
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: [
        {
          text: 'Create a 5-second video. Start by showing the "after" image for 1 second. Then, perform a 3-second vertical line wipe transition from left to right, revealing the "before" image. Hold on the final "before" image for the remaining 1 second. The video should have a 16:9 aspect ratio.',
        },
        { media: { url: afterImage, contentType: afterImageContentType } },
        { media: { url: beforeImage, contentType: beforeImageContentType } },
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

    // Veo returns a URL that requires an API key for access.
    // We will fetch it on the server and return the full data URI.
    const videoDownloadResponse = await fetch(
      `${video.media.url}&key=${process.env.GEMINI_API_KEY}`
    );
    if (
      !videoDownloadResponse.ok ||
      !videoDownloadResponse.body
    ) {
      throw new Error('Failed to download generated video');
    }
    const videoBuffer = Buffer.from(await videoDownloadResponse.arrayBuffer());
    const contentType =
      video.media.contentType ||
      videoDownloadResponse.headers.get('Content-Type') ||
      'video/mp4';
      
    return {
      videoUrl: `data:${contentType};base64,${videoBuffer.toString('base64')}`,
    };
  }
);
