'use server';

import { generateDifferenceSummary } from '@/ai/flows/generate-difference-summary';
import { highlightRelevantDifferences } from '@/ai/flows/highlight-relevant-differences';

export async function compareImages(image1DataUri: string, image2DataUri: string) {
  if (!image1DataUri || !image2DataUri) {
    throw new Error('Both images must be provided as data URIs.');
  }

  try {
    // Run both AI flows in parallel for efficiency
    const [diffResult, summaryResult] = await Promise.all([
      highlightRelevantDifferences({ image1DataUri, image2DataUri }),
      generateDifferenceSummary({ image1DataUri, image2DataUri }),
    ]);

    if (!diffResult.comparisonImage || !summaryResult.summary) {
      throw new Error('AI model did not return the expected results.');
    }

    return {
      comparisonImage: diffResult.comparisonImage,
      summary: summaryResult.summary,
    };
  } catch (error) {
    console.error('AI comparison failed:', error);
    // Provide a more user-friendly error message
    throw new Error(
      'Failed to compare images. The AI service may be temporarily unavailable or the image format is not supported.'
    );
  }
}
