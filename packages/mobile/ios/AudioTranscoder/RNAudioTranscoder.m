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

@implementation RNAudioTranscoder

RCT_EXPORT_MODULE();

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
    NSURL *inputURL = [[NSURL alloc] initFileURLWithPath:inputPath];

    NSString *outputPath = obj[@"output"];
    // Remove "file://" prefix from input file path if present
    if ([outputPath hasPrefix:@"file://"]) {
      outputPath = [outputPath substringFromIndex:@"file://".length];
    }
    NSURL *outputURL = [[NSURL alloc] initFileURLWithPath:outputPath];

    NSLog(@"inputPath: %@", inputPath);
    NSLog(@"outputPath: %@", outputPath);

    AVMutableComposition *input = [[AVMutableComposition alloc] init];
    AVURLAsset *track = [AVURLAsset assetWithURL:inputURL];

    CMTime start = kCMTimeZero;
    NSError *error = nil;

    BOOL success = [input insertTimeRange:CMTimeRangeMake(start, track.duration) ofAsset:track atTime:start error:&error];

    if (!success) {
        NSLog(@"Setup failed");
        reject(@"Setup failed", error.localizedDescription, error);
        return;
    }

    AVAssetExportSession *outputSession = [[AVAssetExportSession alloc] initWithAsset:input presetName:AVAssetExportPresetLowQuality];
    // AVAssetExportSession *outputSession = [[AVAssetExportSession alloc] initWithAsset:input presetName:AVAssetExportPresetPassthrough];
    // outputSession.metadata = input.metadata;
    outputSession.outputURL = outputURL;
    outputSession.outputFileType = AVFileTypeMPEGLayer3;
    // outputSession.outputFileType = AVFileTypeAppleM4A;

    [outputSession exportAsynchronouslyWithCompletionHandler:^{

        if (outputSession.status == AVAssetExportSessionStatusCompleted)
        {
            NSLog(@"Export Success");
            resolve(@"Successfully encoded audio");
        }
        else if (outputSession.status == AVAssetExportSessionStatusCancelled)
        {
            NSLog(@"Export Cancelled");
            reject(@"Export Cancelled", @"Exporting audio file was cancelled", nil);
        }
        else
        {
            NSLog(@"Export Failed");
            reject(@"Export Failed", outputSession.error.localizedDescription, outputSession.error);
        }

    }];
}

@end
