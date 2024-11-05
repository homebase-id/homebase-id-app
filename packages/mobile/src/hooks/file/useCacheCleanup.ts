import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { CachesDirectoryPath, readDir, unlink } from 'react-native-fs';

const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000;
const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
const cleanupCache = async () => {
  console.log('[CacheCleanup] Starting...');

  let cleanedUpCount = 0;
  const allFilesInCache = await readDir(CachesDirectoryPath);
  console.log(`[CacheCleanup] found ${allFilesInCache.length} items in caches directory`);

  const thresholdDate = __DEV__ ? oneWeekAgo : fourWeeksAgo;

  for (let i = 0; i < allFilesInCache.length; i++) {
    const file = allFilesInCache[i];
    if (!file.isFile()) continue;
    if (file.name.startsWith('rn_image_picker_lib_temp_')) {
      cleanedUpCount++;
      await unlink(file.path);
      continue;
    }
    const time = file.ctime || file.mtime;
    if (time && time.getTime() >= thresholdDate) {
      cleanedUpCount++;
      await unlink(file.path);
      continue;
    }
  }

  console.log('[CacheCleanup] Finished; Cleaned up count: ', cleanedUpCount);
};

// Android isn't great at cleaning up cache files (and rn_image-picker creates lots more on Android), so we'll do it ourselves;
export const useCacheCleanup = () => {
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current || Platform.OS !== 'android') return;
    hasRun.current = true;
    cleanupCache();
  }, []);
};
