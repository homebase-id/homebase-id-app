//
//  RNAudioTranscoder.m
//  HomebaseFeed
//
//  Created by Stef Coenen on 28/03/2024.
//

#import <Foundation/Foundation.h>

#import "RNAudioTranscoder.h"
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>
#import <React/RCTLog.h>
#import <AVFoundation/AVFoundation.h>

#include <stdio.h>
// Import LAME headers
#import "lame/lame.h"

@implementation RNAudioTranscoder

RCT_EXPORT_MODULE();

Boolean convertAACToPCMData(NSString *inputFilePath, NSString *outputFilePath) {
    @try {
        NSURL *inputURL = [[NSURL alloc] initFileURLWithPath:inputFilePath];
        NSURL *outputURL = [[NSURL alloc] initFileURLWithPath:outputFilePath];

        AVURLAsset *asset = [AVURLAsset URLAssetWithURL:inputURL options:nil];
        AVAssetReader *assetReader = [AVAssetReader assetReaderWithAsset:asset error:nil];

        AVAssetTrack *audioTrack = [[asset tracksWithMediaType:AVMediaTypeAudio] objectAtIndex:0];

        NSDictionary *outputSettings = @{
            AVFormatIDKey: @(kAudioFormatLinearPCM),
            AVLinearPCMIsBigEndianKey: @NO,
            AVLinearPCMIsFloatKey: @NO,
            AVLinearPCMBitDepthKey: @(16),
            AVLinearPCMIsNonInterleaved: @NO
        };

        AVAssetReaderTrackOutput *output = [AVAssetReaderTrackOutput assetReaderTrackOutputWithTrack:audioTrack outputSettings:outputSettings];

        [assetReader addOutput:output];
        [assetReader startReading];

        NSMutableData *pcmData = [NSMutableData data];

        CMSampleBufferRef sampleBuffer;
        while ((sampleBuffer = [output copyNextSampleBuffer])) {
            CMBlockBufferRef blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer);
            size_t length = CMBlockBufferGetDataLength(blockBuffer);
            NSMutableData *data = [NSMutableData dataWithLength:length];
            CMBlockBufferCopyDataBytes(blockBuffer, 0, length, data.mutableBytes);
            [pcmData appendData:data];
            CMSampleBufferInvalidate(sampleBuffer);
            CFRelease(sampleBuffer);
        }

        [assetReader cancelReading];

        // Write PCM data to file
        [pcmData writeToURL:outputURL atomically:YES];

        return true;
    }
    @catch (NSException *exception) {
        NSLog(@"Exception occurred: %@", exception);
        //reject(@"Export Failed", @"Something went wrong", exception);
        return false;
    }
}

RCT_EXPORT_METHOD(
    transcode: (NSDictionary *) obj
    resolver:(RCTPromiseResolveBlock) resolve
    rejecter: (RCTPromiseRejectBlock) reject
) {
    NSString *inputPath = obj[@"input"];
    // Remove "file://" prefix from input file path if present
    if ([inputPath hasPrefix:@"file://"]) {
      inputPath = [inputPath substringFromIndex:@"file://".length];
    }

    NSString *tempPath = obj[@"temp"];
    // Remove "file://" prefix from input file path if present
    if ([tempPath hasPrefix:@"file://"]) {
      tempPath = [tempPath substringFromIndex:@"file://".length];
    }

    NSString *outputPath = obj[@"output"];
    // Remove "file://" prefix from input file path if present
    if ([outputPath hasPrefix:@"file://"]) {
      outputPath = [outputPath substringFromIndex:@"file://".length];
    }

    NSLog(@"inputPath: %@", inputPath);
    NSLog(@"tempPath: %@", tempPath);
    NSLog(@"outputPath: %@", outputPath);

    if(!convertAACToPCMData(inputPath, tempPath)){
      NSLog(@"Failed to convert to PCM");
    }

    @try {
        // Open the input PCM file
        FILE *pcmFile = fopen([tempPath cStringUsingEncoding:NSUTF8StringEncoding], "rb");
        fseek(pcmFile, 4*1024, SEEK_CUR);

        // Create output MP3 file
        FILE *mp3File = fopen([outputPath cStringUsingEncoding:NSUTF8StringEncoding], "wb");

        // Initialize the MP3 encoder
        lame_t lame = lame_init();
        lame_set_in_samplerate(lame, 44100); // Sample rate of input audio
        lame_set_VBR(lame, vbr_default); // Set variable bit rate
        lame_init_params(lame);

        const int PCM_SIZE = 8192;
        short int pcmBuffer[PCM_SIZE*2];
        unsigned char mp3Buffer[PCM_SIZE];

        // Read input data, encode to MP3, and write output data
        int bytesRead, bytesEncoded, bytesWritten;
        do {
          bytesRead = (int)fread(pcmBuffer, 2 * sizeof(short int), PCM_SIZE, pcmFile); // Read 8192 samples

          NSLog(@"Bytes read %d", bytesRead);

          if (bytesRead == 0)
             bytesEncoded = lame_encode_flush(lame, mp3Buffer, PCM_SIZE); // Flush the encoder
          else
             bytesEncoded = lame_encode_buffer_interleaved(lame, pcmBuffer, bytesRead, mp3Buffer, PCM_SIZE); // Encode the audio

          bytesWritten = fwrite(mp3Buffer, 1, bytesEncoded, mp3File); // Write encoded data to MP3 file

          NSLog(@"Bytes written %d", bytesWritten);
        } while (bytesRead > 0);

        // Clean up
        fclose(pcmFile);
        fclose(mp3File);
        lame_close(lame);

        NSLog(@"Conversion completed successfully.");
        resolve(@"Successfully encoded audio");
    }
    @catch (NSException *exception) {
        NSLog(@"Exception occurred: %@", exception);
        //reject(@"Export Failed", @"Something went wrong", exception);
    }
}

@end
