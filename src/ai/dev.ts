import { config } from 'dotenv';
config();

import '@/ai/flows/identify-plant-species.ts';
import '@/ai/flows/detect-plant-disease.ts';
import '@/ai/flows/recommend-treatment.ts';