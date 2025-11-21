'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ResultCard } from '@/components/result-card';
import { identifyPlantSpecies, IdentifyPlantSpeciesOutput } from '@/ai/flows/identify-plant-species';
import { detectPlantDisease, DetectPlantDiseaseOutput } from '@/ai/flows/detect-plant-disease';
import { recommendTreatment, RecommendTreatmentOutput } from '@/ai/flows/recommend-treatment';
import { Loader2, Sprout, HeartPulse, TestTube2, Camera, RefreshCw, AlertTriangle, SwitchCamera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function PlantAnalyzer() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speciesResult, setSpeciesResult] = useState<IdentifyPlantSpeciesOutput | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<DetectPlantDiseaseOutput | null>(null);
  const [treatmentResult, setTreatmentResult] = useState<RecommendTreatmentOutput | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const getCameraStream = useCallback(async (mode: 'environment' | 'user') => {
    try {
      // Stop any existing stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: mode } } });
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // If the exact facing mode fails, try the other one.
      if (mode === 'environment') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            setHasCameraPermission(true);
            setFacingMode('user');
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (e) {
             setHasCameraPermission(false);
             toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings to use this app.',
             });
        }
      } else {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Could not access any camera. Please enable camera permissions.',
        });
      }
    }
  }, [toast]);

  useEffect(() => {
    getCameraStream(facingMode);
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [facingMode, getCameraStream]);
  

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUri = canvas.toDataURL('image/jpeg');
        setImagePreview(dataUri);
        setImageDataUri(dataUri);
        setSpeciesResult(null);
        setDiseaseResult(null);
        setTreatmentResult(null);
      }
    }
  };

  const handleRetake = () => {
    setImagePreview(null);
    setImageDataUri(null);
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleAnalyze = async () => {
    if (!imageDataUri) {
      toast({
        variant: "destructive",
        title: "No image captured",
        description: "Please capture a photo of a plant to analyze.",
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
        <p className="mt-2 text-lg text-muted-foreground">Use your camera to identify plants, diagnose diseases, and get treatment advice.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-8">
            <div className="relative w-full max-w-md aspect-video bg-black rounded-md">
              <video ref={videoRef} className={`w-full h-full object-cover rounded-md ${imagePreview ? 'hidden' : 'block'}`} autoPlay muted playsInline />
              {imagePreview && (
                <Image src={imagePreview} alt="Plant preview" layout="fill" objectFit="contain" className="rounded-md" />
              )}
              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 rounded-md">
                  <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
                  <p className="text-center font-semibold">Camera permission denied.</p>
                  <p className="text-center text-sm">Please enable camera access in your browser settings.</p>
                </div>
              )}
               {!imagePreview && hasCameraPermission && (
                <Button onClick={handleSwitchCamera} variant="ghost" size="icon" className="absolute top-2 right-2 text-white bg-black/30 hover:bg-black/50 hover:text-white">
                  <SwitchCamera className="h-5 w-5" />
                </Button>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
          </div>
          <div className="mt-6 flex justify-center gap-4">
            {!imagePreview ? (
              <Button onClick={handleCapture} disabled={hasCameraPermission !== true} size="lg">
                <Camera className="mr-2 h-4 w-4" />
                Capture Photo
              </Button>
            ) : (
              <>
                <Button onClick={handleRetake} variant="outline" size="lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button onClick={handleAnalyze} disabled={loading || !imagePreview} size="lg">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {loading ? 'Analyzing...' : 'Analyze Plant'}
                </Button>
              </>
            )}
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
