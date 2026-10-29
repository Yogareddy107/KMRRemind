import '@testing-library/jest-dom';

// Mock Web Audio API
if (typeof window !== 'undefined') {
  (window as any).AudioContext = class {
    currentTime = 0;
    state = 'running';
    createOscillator() {
      return {
        type: 'sine',
        frequency: { setValueAtTime: () => {} },
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
        },
        connect: () => {},
      };
    }
    resume() {
      return Promise.resolve();
    }
    destination = {};
  };

  // Mock Notification API
  (window as any).Notification = {
    permission: 'default',
    requestPermission: () => Promise.resolve('granted'),
  };
}

