import { NewText } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const DisplayPage = () => {
  const { roomId } = useRouter().query;

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        window.location.href = 'https://meet.google.com/landing?instantMeeting=true';
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="container-lined p-8 my-4">
          <Clock />
          <p className="text-size-lg mt-16 mb-8">
            This room is ready for your meeting.
          </p>
          <NewText.P className="mb-4">Control it at <span className="font-mono bg-stone-200 px-2 py-1 rounded select-all">{window.location.host}/{roomId}</span></NewText.P>
          <NewText.P>Or hit <kbd className="font-mono bg-stone-50 border shadow px-2 mx-1 py-1 rounded">Enter</kbd> to start an instant meeting</NewText.P>
        </div>

        <div className="text-size-sm text-gray-500 flex gap-2 justify-center">
          <span>Room ID: <span className="select-all">{roomId}</span></span>
        </div>
      </div>
    </div>
  );
};

const Clock = () => {
  const [, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  });

  return (
    <>
      <div className="text-7xl font-bold mb-2">
        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-3xl text-gray-600">
        {new Date().toLocaleDateString()}
      </div>
    </>
  );
};

export default DisplayPage;
