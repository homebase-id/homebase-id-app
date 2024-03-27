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
    NSURL *inputURL = [[NSURL alloc] initFileURLWithPath:inputPath];
    NSString *outputPath = obj[@"output"];
    NSURL *outputURL = [[NSURL alloc] initFileURLWithPath:outputPath];

    NSError *rgError = nil;
    NSRegularExpression *replacer = [NSRegularExpression regularExpressionWithPattern:@"\\.m4a$"
                                                                              options:NSRegularExpressionCaseInsensitive
                                                                                error:&rgError];

    NSString *tempPath = [replacer stringByReplacingMatchesInString:outputPath
                                                            options:0
                                                              range:NSMakeRange(0, outputPath.length)
                                                       withTemplate:@".m4a"];

    if (rgError != nil) {
        reject(@"Failed to create temp path for output", rgError.localizedDescription, rgError);
        return;
    }

    NSURL *tempUrl = [[NSURL alloc] initFileURLWithPath:tempPath];

    AVMutableComposition *input = [[AVMutableComposition alloc] init];
    AVURLAsset *track = [AVURLAsset assetWithURL:inputURL];

    CMTime start = kCMTimeZero;
    NSError *error = nil;

    BOOL success = [input insertTimeRange:CMTimeRangeMake(start, track.duration) ofAsset:track atTime:start error:&error];

    if (!success) {
        reject(@"Setup failed", error.localizedDescription, error);
        return;
    }

    AVAssetExportSession *outputSession = [[AVAssetExportSession alloc] initWithAsset:input presetName:AVAssetExportPresetPassthrough];
    outputSession.metadata = input.metadata;
    outputSession.outputURL = tempUrl;
    outputSession.outputFileType = AVFileTypeAppleM4A;

    [outputSession exportAsynchronouslyWithCompletionHandler:^{

        if (outputSession.status == AVAssetExportSessionStatusCompleted)
        {

            resolve(@"Successfully encoded audio");
        }
        else if (outputSession.status == AVAssetExportSessionStatusCancelled)
        {
            reject(@"Export Cancelled", @"Exporting audio file was cancelled", nil);
        }
        else
        {
            reject(@"Export Failed", outputSession.error.localizedDescription, outputSession.error);
        }

    }];
}

@end
