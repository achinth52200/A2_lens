'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ResultCard } from '@/components/result-card';
import { identifyPlantSpecies, IdentifyPlantSpeciesOutput } from '@/ai/flows/identify-plant-species';
import { detectPlantDisease, DetectPlantDiseaseOutput } from '@/ai/flows/detect-plant-disease';
import { recommendTreatment, RecommendTreatmentOutput } from '@/ai/flows/recommend-treatment';
import { Loader2, Sprout, HeartPulse, TestTube2, UploadCloud } from 'lucide-react';

export function PlantAnalyzer() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speciesResult, setSpeciesResult] = useState<IdentifyPlantSpeciesOutput | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<DetectPlantDiseaseOutput | null>(null);
  const [treatmentResult, setTreatmentResult] = useState<RecommendTreatmentOutput | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "Please upload an image smaller than 4MB.",
        });
        return;
      }

      // Reset previous results
      setSpeciesResult(null);
      setDiseaseResult(null);
      setTreatmentResult(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imageDataUri) {
      toast({
        variant: "destructive",
        title: "No image selected",
        description: "Please upload an image of a plant to analyze.",
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [species, disease] = await Promise.all([
        identifyPlantSpecies({ photoDataUri: imageDataUri }),
        detectPlantDisease({ photoDataUri: imageDataUri }),
      ]);
      setSpeciesResult(species);
      setDiseaseResult(disease);

      if (disease.diseaseDetected) {
        const treatment = await recommendTreatment({
          diseaseName: disease.diseaseName,
          plantSpecies: species.species,
        });
        setTreatmentResult(treatment);
      } else {
        setTreatmentResult(null);
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "There was a problem analyzing your image. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Your Personal Plant Pathologist</h1>
        <p className="mt-2 text-lg text-muted-foreground">Upload a photo of your plant to identify it, diagnose diseases, and get treatment advice.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            {imagePreview ? (
              <div className="relative w-full max-w-md aspect-video">
                <Image src={imagePreview} alt="Plant preview" layout="fill" objectFit="contain" className="rounded-md" />
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 4MB</p>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-center">
            <Button onClick={handleAnalyze} disabled={loading || !imagePreview} size="lg">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? 'Analyzing...' : 'Analyze Plant'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(speciesResult || diseaseResult) && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-center font-headline">Analysis Results</h2>
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
            {speciesResult && (
              <ResultCard icon={<Sprout className="h-8 w-8 text-primary" />} title="Plant Species">
                <h3 className="text-xl font-semibold font-headline">{speciesResult.species}</h3>
                <p className="text-sm text-muted-foreground">Confidence: {(speciesResult.confidence * 100).toFixed(0)}%</p>
                <p className="mt-2 text-sm">{speciesResult.description}</p>
              </ResultCard>
            )}
            {diseaseResult && (
              <ResultCard icon={<HeartPulse className="h-8 w-8 text-primary" />} title="Health Status">
                {diseaseResult.diseaseDetected ? (
                  <>
                    <h3 className="text-xl font-semibold font-headline text-destructive">{diseaseResult.diseaseName}</h3>
                    <p className="mt-2 text-sm font-semibold">Symptoms:</p>
                    <p className="mt-1 text-sm">{diseaseResult.symptomsDescription}</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold font-headline text-accent">Healthy</h3>
                    <p className="mt-2 text-sm">No disease detected. Your plant appears to be in good health!</p>
                  </>
                )}
              </ResultCard>
            )}
            {treatmentResult && diseaseResult?.diseaseDetected && (
              <ResultCard icon={<TestTube2 className="h-8 w-8 text-primary" />} title="Recommended Treatment">
                <h3 className="text-xl font-semibold font-headline">{treatmentResult.treatment}</h3>
                <p className="mt-2 text-sm font-semibold">Dosage:</p>
                <p className="mt-1 text-sm">{treatmentResult.dosage}</p>
              </ResultCard>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
