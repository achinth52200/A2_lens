'use server';

/**
 * @fileOverview A plant species identification AI agent.
 *
 * - identifyPlantSpecies - A function that handles the plant species identification process.
 * - IdentifyPlantSpeciesInput - The input type for the identifyPlantSpecies function.
 * - IdentifyPlantSpeciesOutput - The return type for the identifyPlantSpecies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyPlantSpeciesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyPlantSpeciesInput = z.infer<typeof IdentifyPlantSpeciesInputSchema>;

const IdentifyPlantSpeciesOutputSchema = z.object({
  species: z.string().describe('The identified species of the plant.'),
  confidence: z.number().describe('The confidence level of the identification (0-1).'),
  description: z.string().describe('A brief description of the plant species.'),
});
export type IdentifyPlantSpeciesOutput = z.infer<typeof IdentifyPlantSpeciesOutputSchema>;

export async function identifyPlantSpecies(input: IdentifyPlantSpeciesInput): Promise<IdentifyPlantSpeciesOutput> {
  return identifyPlantSpeciesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPlantSpeciesPrompt',
  input: {schema: IdentifyPlantSpeciesInputSchema},
  output: {schema: IdentifyPlantSpeciesOutputSchema},
  prompt: `You are an expert botanist specializing in plant species identification.

You will use the provided photo to identify the plant species.

Analyze the following image to determine the plant species. Provide a confidence level (0-1) for your identification and a brief description of the plant.

Photo: {{media url=photoDataUri}}`,
});

const identifyPlantSpeciesFlow = ai.defineFlow(
  {
    name: 'identifyPlantSpeciesFlow',
    inputSchema: IdentifyPlantSpeciesInputSchema,
    outputSchema: IdentifyPlantSpeciesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
