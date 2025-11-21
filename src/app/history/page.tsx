import Image from 'next/image';
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

type HistoryLog = {
  id: string;
  plantName: string;
  disease: string;
  status: 'Healthy' | 'Diseased';
  date: Date;
  image: ImagePlaceholder;
};

const mockHistory: HistoryLog[] = [
  {
    id: '1',
    plantName: 'Tomato Plant',
    disease: 'Early Blight',
    status: 'Diseased',
    date: new Date(2023, 10, 15),
    image: PlaceHolderImages.find(img => img.id === 'history-1')!,
  },
  {
    id: '2',
    plantName: 'Rose Bush',
    disease: 'Black Spot',
    status: 'Diseased',
    date: new Date(2023, 10, 12),
    image: PlaceHolderImages.find(img => img.id === 'history-2')!,
  },
  {
    id: '3',
    plantName: 'Echeveria',
    disease: 'None',
    status: 'Healthy',
    date: new Date(2023, 10, 10),
    image: PlaceHolderImages.find(img => img.id === 'history-3')!,
  },
];

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Diagnosis History</h1>
        <p className="mt-2 text-lg text-muted-foreground">Review your past plant health analyses.</p>
      </div>
      
      {mockHistory.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockHistory.map(log => (
            <Card key={log.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="relative aspect-[4/3]">
                  <Image 
                    src={log.image.imageUrl} 
                    alt={log.image.description}
                    data-ai-hint={log.image.imageHint}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-headline">{log.plantName}</CardTitle>
                  <Badge variant={log.status === 'Healthy' ? 'default' : 'destructive'} className={log.status === 'Healthy' ? 'bg-accent text-accent-foreground' : ''}>
                    {log.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {log.status === 'Diseased' ? log.disease : 'No disease detected'}
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">{format(log.date, 'MMMM d, yyyy')}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No History Found</h2>
          <p className="text-muted-foreground mt-2">Start diagnosing your plants to build your history log.</p>
        </div>
      )}
    </div>
  );
}
