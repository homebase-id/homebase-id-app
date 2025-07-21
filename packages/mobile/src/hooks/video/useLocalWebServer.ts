import { useEffect } from 'react';
import { CachesDirectoryPath, readFile } from 'react-native-fs';
// import { BridgeServer } from 'react-native-http-bridge-refurbished';

export const useLocalWebServer = (eanbled?: boolean) => {
  useEffect(() => {
    if (!eanbled) return;
    throw new Error('react-native-http-bridge-refurbished is not supported');
    // const server = new BridgeServer('http_service', true);
    // server.get('*', async (req, res) => {
    //   if (req.url.startsWith('/manifest')) {
    //     const fileName = req.url.split('/manifest?file=')[1];

    //     const localFile = await readFile(`file://${CachesDirectoryPath}/${fileName}`, 'utf8');
    //     return res.send(200, 'application/vnd.apple.mpegurl', localFile);
    //   }

    //   return res.send(404, 'text/plain', 'Not Found');
    // });
    // server.listen(3000);

    // return () => server.stop();
  }, [eanbled]);
};
