import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { Button } from '@/components/ui/button';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

export default function MusicControl() {
  const { isPlaying, toggleMusic, volume, setMusicVolume } = useBackgroundMusic();
  const [showVolume, setShowVolume] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Music Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleMusic}
        className={cn(
          'relative transition-all',
          isPlaying && 'bg-primary/10 border-primary text-primary'
        )}
        title={isPlaying ? 'Turn off music' : 'Turn on music'}
      >
        <Music className="w-4 h-4" />
        {isPlaying && (
          <span className="absolute inset-0 rounded-md border border-primary/50 animate-pulse" />
        )}
      </Button>

      {/* Volume Control */}
      {isPlaying && (
        <div
          className="flex items-center gap-2"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          {volume > 0 ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
          {showVolume && (
            <Slider
              value={[volume]}
              onValueChange={(val) => setMusicVolume(val[0])}
              min={0}
              max={1}
              step={0.1}
              className="w-20"
            />
          )}
        </div>
      )}
    </div>
  );
}
