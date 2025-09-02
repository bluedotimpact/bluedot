import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ProgressDots } from '@bluedot/ui';

const CourseUnitRedirectPage = () => {
  const router = useRouter();
  const { courseSlug, unitNumber, chunk } = router.query;

  useEffect(() => {
    if (typeof courseSlug === 'string' && typeof unitNumber === 'string') {
      let chunkNumber = 1;

      // Handle old ?chunk={n-1} format
      if (typeof chunk === 'string') {
        const oldChunkIndex = parseInt(chunk, 10);
        if (!Number.isNaN(oldChunkIndex) && oldChunkIndex >= 0) {
          chunkNumber = oldChunkIndex + 1;
        }
      }

      router.replace(`/courses/${courseSlug}/${unitNumber}/${chunkNumber}`);
    }
  }, [courseSlug, unitNumber, chunk, router]);

  return <ProgressDots />;
};

export default CourseUnitRedirectPage;
