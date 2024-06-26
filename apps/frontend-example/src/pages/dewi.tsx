import { useState, useEffect } from 'react';
import {
  H1, P,
} from '@bluedot/ui';

const Dewi = () => {
  const [value, setValue] = useState(0);
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange']; // Add more colors as needed
  const images = ['bdi.png', 'aisf.png', 'bsf.png']; // Array of images

  // Function to get the next color based on the current value
  const getNextColor = () => colors[value % colors.length]!;
  const getCurrentImage = () => images[value % images.length];

  useEffect(() => {
    // Set up an interval that updates the value every 1000 milliseconds (1 second)
    const interval = setInterval(() => {
      setValue((currentValue) => currentValue + 1);
    }, 200);

    // Clean up the interval when the component is unmounted
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update the background color of the main element
    (document.getElementsByClassName('bluedot-base')[0] as HTMLElement).style.backgroundColor = getNextColor();
  }, [value]); // Dependency array to run effect when value changes

  return (
    <div className="mx-8">
      <H1>Dewi's magic page</H1>
      <P className="mt-8">Value is {value}</P>
      <img src={getCurrentImage()} alt="" style={{ width: '300px' }} />
    </div>
  );
};

export default Dewi;
