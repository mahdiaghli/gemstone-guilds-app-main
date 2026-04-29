import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info';
  message: string;
}

export function useLogPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsRef = useRef<LogEntry[]>([]);

  useEffect(() => {
    // Capture console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addLog = (level: 'log' | 'error' | 'warn' | 'info', message: string) => {
      const entry: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
      };
      logsRef.current = [...logsRef.current, entry];
      setLogs(logsRef.current);
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, []);

  return { logs, clearLogs: () => setLogs([]) };
}

interface LogPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function LogPanel({ logs, onClear }: LogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-green-500';
    }
  };

  const getLogBg = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-500/10';
      case 'warn': return 'bg-yellow-500/10';
      case 'info': return 'bg-blue-500/10';
      default: return 'bg-green-500/10';
    }
  };

  const copyToClipboard = () => {
    const text = logs.map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 z-50 w-96 max-h-96 bg-black/90 border border-green-500/30 rounded-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-green-500/20 border-b border-green-500/30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-mono text-green-500">
                📊 LOG PANEL | لاگ پینل
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={copyToClipboard}
              >
                <Copy className="w-3 h-3 text-green-500" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  onClear();
                }}
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <ChevronDown 
                  className={`w-3 h-3 text-green-500 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-3 h-3 text-green-500" />
              </Button>
            </div>
          </div>

          {/* Logs */}
          {isExpanded && (
            <ScrollArea className="h-80 bg-black/50">
              <div className="p-3 space-y-1">
                {logs.length === 0 ? (
                  <div className="text-xs text-gray-500">No logs yet...</div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`text-xs font-mono p-2 rounded border-l-2 ${getLogBg(
                        log.level
                      )} ${getLogColor(log.level)}`}
                    >
                      <div className="flex justify-between gap-2">
                        <span>{log.timestamp}</span>
                        <span>[{log.level.toUpperCase()}]</span>
                      </div>
                      <div className="mt-1 break-words text-gray-300">
                        {log.message}
                      </div>
                    </div>
                  ))
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          )}

          {/* Compact view - show latest logs count */}
          {!isExpanded && (
            <div className="p-2 text-xs text-green-500 font-mono">
              📝 {logs.length} لاگ ریکورد شد | {logs.length} logs recorded
            </div>
          )}
        </motion.div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 right-4 z-50 bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-500 font-mono text-sm hover:bg-green-500/30 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          📊 Logs ({logs.length})
        </motion.button>
      )}
    </AnimatePresence>
  );
}
