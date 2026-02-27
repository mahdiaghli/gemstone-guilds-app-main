import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LogPanel, useLogPanel } from '@/components/LogPanel';
import { useLanguage } from '@/hooks/useLanguage';

// Simple UUID v4 generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function OnlineLobby() {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const { logs, clearLogs } = useLogPanel();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [generatedRoom, setGeneratedRoom] = useState('');
  const [playerCount, setPlayerCount] = useState(2);
  const [copied, setCopied] = useState(false);

  // Generate random room code
  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedRoom(code);
  };

  // Copy room code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedRoom);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Create new room
  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!generatedRoom) {
      generateRoomCode();
      return;
    }

    const playerId = generateUUID();

    // Store room info in localStorage
    localStorage.setItem('splendor-online-room', JSON.stringify({
      roomId: generatedRoom,
      playerId,
      playerName,
      isHost: true,
      playerCount,
    }));

    // OnlineGame component will handle joining the room
    navigate(`/online-game/${generatedRoom}?player=${playerId}`);
  };

  // Join existing room
  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      alert('Please enter room code');
      return;
    }

    const playerId = generateUUID();

    // Store room info in localStorage
    localStorage.setItem('splendor-online-room', JSON.stringify({
      roomId: roomCode.toUpperCase(),
      playerId,
      playerName,
      isHost: false,
    }));

    // OnlineGame component will handle joining the room
    navigate(`/online-game/${roomCode.toUpperCase()}?player=${playerId}`);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4"
      dir={dir}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-cinzel font-bold text-primary">
            💎 Splendor Guilds
          </h1>
          <p className="text-muted-foreground">{t('onlinePlay')}</p>
        </div>

        {/* Player Name Input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <label className="block text-sm font-medium">{t('player')} Name</label>
          <input
            type="text"
            placeholder="Enter your name..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-primary/20 bg-card focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </motion.div>

        {/* Create Room Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 border border-primary/20 rounded-xl p-4 space-y-4"
        >
          <h2 className="font-cinzel text-lg text-primary">📍 Create Room</h2>

          {/* Player Count */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Players</label>
            <div className="flex gap-2">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  className={`flex-1 py-2 rounded-lg border-2 transition-all font-cinzel ${
                    playerCount === count
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/30 hover:border-primary/50'
                  }`}

                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Room Code */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Room Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Generate code..."
                value={generatedRoom}
                readOnly
                className="flex-1 px-4 py-2 rounded-lg border border-primary/20 bg-card/50 font-mono font-bold text-center"
              />
              <button
                onClick={generateRoomCode}
                className="px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary font-cinzel"
              >
                🔄
              </button>
            </div>
            {generatedRoom && (
              <button
                onClick={copyToClipboard}
                className="w-full py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm transition-all"
              >
                {copied ? '✓ Copied!' : '📋 Copy Code'}
              </button>
            )}
          </div>

          <Button
            onClick={handleCreateRoom}
            variant="game"
            disabled={!playerName.trim()}
            className="w-full"
          >
            🎮 Create Room
          </Button>
        </motion.div>

        {/* Join Room Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card/50 border border-primary/20 rounded-xl p-4 space-y-4"
        >
          <h2 className="font-cinzel text-lg text-primary">🔗 Join Room</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Room Code</label>
            <input
              type="text"
              placeholder="Enter room code..."
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full px-4 py-2 rounded-lg border border-primary/20 bg-card focus:outline-none focus:ring-2 focus:ring-primary font-mono font-bold text-center"
            />
          </div>

          <Button
            onClick={handleJoinRoom}
            variant="game-secondary"
            disabled={!playerName.trim() || !roomCode.trim()}
            className="w-full"
          >
            ✅ Join Room
          </Button>
        </motion.div>

        {/* Back Button */}
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="w-full text-muted-foreground"
        >
          ← {t('menu')}
        </Button>
      </motion.div>

      {/* Log Panel */}
      <LogPanel logs={logs} onClear={clearLogs} />
    </div>
  );
}
