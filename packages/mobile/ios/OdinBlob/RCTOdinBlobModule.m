//
//  RCTOdinBlobModule.m
//  HomebasePhotos
//
//  Created by Stef Coenen on 31/01/2024.
//

#import <Foundation/Foundation.h>
#import <CommonCrypto/CommonCryptor.h>

// RCTCalendarModule.m
#import "RCTOdinBlobModule.h"
#import <React/RCTLog.h>

@implementation RCTOdinBlobModule

// To export a module named RCTCalendarModule
RCT_EXPORT_MODULE();

Boolean encryptFileWithAES_CBC(NSString *inputFilePath, NSString *outputFilePath, NSData *key, NSData *initialIV) {
  // Initialize the encryption operation
  CCOptions options = kCCOptionPKCS7Padding;
  const void *keyPtr = [key bytes];

  size_t keyLength = [key length];

  // Check if the file path starts with "file://"
  if ([inputFilePath hasPrefix:@"file://"]) {
      // Remove the "file://" prefix
    inputFilePath = [inputFilePath substringFromIndex:@"file://".length];
  }

  // Open the input file for reading
  NSFileHandle *inputFile = [NSFileHandle fileHandleForReadingAtPath:inputFilePath];
  if (!inputFile) {
     NSLog(@"Unable to open input file. %@", inputFilePath);
     return false;
  }

  // Check if the file path starts with "file://"
  if ([outputFilePath hasPrefix:@"file://"]) {
      // Remove the "file://" prefix
    outputFilePath = [outputFilePath substringFromIndex:@"file://".length];
  }

  // Create an output file for writing the encrypted data
  [[NSFileManager defaultManager] createFileAtPath:outputFilePath contents:nil attributes:nil];
  NSFileHandle *outputFile = [NSFileHandle fileHandleForWritingAtPath:outputFilePath];
  if (!outputFile) {
     NSLog(@"Unable to create output file.");
     [inputFile closeFile];
     return false;
  }

  // Initialize the buffer
  size_t blockSize = kCCBlockSizeAES128;
  size_t chunkSize = blockSize;  // You can adjust this based on your needs
  uint8_t *buffer = malloc(chunkSize);

  // Initialize the IV
  NSMutableData *iv = [initialIV mutableCopy];
  NSMutableData *lastPadding = [initialIV mutableCopy];

  // Read and encrypt the file in chunks
  while (YES) {
    @autoreleasepool {
        NSData *inputData = [inputFile readDataOfLength:chunkSize];

        if ([inputData length] == 0) {
          // Reached end of file
          break;
        }

        size_t bufferSize = [inputData length] + blockSize;
        void *encryptedBuffer = malloc(bufferSize);

        // Perform the encryption
        size_t numBytesEncrypted = 0;
        CCCryptorStatus result = CCCrypt(kCCEncrypt,
                                        kCCAlgorithmAES,
                                        options,
                                        keyPtr,
                                        keyLength,
                                        [iv bytes],
                                        [inputData bytes],
                                        [inputData length],
                                        encryptedBuffer,
                                        bufferSize,
                                        &numBytesEncrypted);

        if (result == kCCSuccess) {
          // Get the last 16 bytes (padding) of the encrypted data
          [lastPadding replaceBytesInRange:NSMakeRange(0, blockSize) withBytes:encryptedBuffer + numBytesEncrypted - blockSize];

          // Remove the padding from the encrypted data
          numBytesEncrypted -= blockSize;

          // Copy the last block of the encrypted data into the iv (without padding)
          [iv replaceBytesInRange:NSMakeRange(0, blockSize) withBytes:encryptedBuffer + numBytesEncrypted - blockSize];

          // Write the encrypted data to the output file
          NSData *encryptedData = [NSData dataWithBytesNoCopy:encryptedBuffer length:numBytesEncrypted freeWhenDone:NO];
          [outputFile writeData:encryptedData];

          [iv replaceBytesInRange:NSMakeRange(0, blockSize) withBytes:encryptedBuffer + numBytesEncrypted - blockSize];
          free(encryptedBuffer);
        } else {
            NSLog(@"Encryption failed with status code %d", result);
            free(encryptedBuffer);
            break;
        }
    }
  }

  // Write the last block of the encrypted data (padding)
  [outputFile writeData:lastPadding];

  // Close file handles
  [inputFile closeFile];
  [outputFile closeFile];
  free(buffer);
  return true;
}


BOOL decryptFileWithAES_CBC(NSString *inputFilePath, NSString *outputFilePath, NSData *key, NSData *initialIV) {
    // Initialize the decryption operation
    CCOptions options = kCCOptionPKCS7Padding;
    const void *keyPtr = [key bytes];
    size_t keyLength = [key length];

    // Remove "file://" prefix from input file path if present
    if ([inputFilePath hasPrefix:@"file://"]) {
        inputFilePath = [inputFilePath substringFromIndex:@"file://".length];
    }

    // Remove "file://" prefix from output file path if present
    if ([outputFilePath hasPrefix:@"file://"]) {
        outputFilePath = [outputFilePath substringFromIndex:@"file://".length];
    }

    // Open the input file for reading
    NSFileHandle *inputFile = [NSFileHandle fileHandleForReadingAtPath:inputFilePath];
    if (!inputFile) {
        NSLog(@"Unable to open input file %@", inputFilePath);
        return NO;
    }

    // Create an output file for writing the decrypted data
    [[NSFileManager defaultManager] createFileAtPath:outputFilePath contents:nil attributes:nil];
    NSFileHandle *outputFile = [NSFileHandle fileHandleForWritingAtPath:outputFilePath];
    if (!outputFile) {
        NSLog(@"Unable to create output file %@", outputFilePath);
        [inputFile closeFile];
        return NO;
    }

    // Initialize the buffer
    size_t blockSize = kCCBlockSizeAES128;
    size_t chunkSize = 1024;  // You can adjust this based on your needs
    uint8_t *buffer = malloc(chunkSize + blockSize);  // Additional space for IV

    // Initialize the IV
    NSMutableData *iv = [initialIV mutableCopy];

    // Initialize the decryption context
    CCCryptorRef cryptor;
    CCCryptorStatus status = CCCryptorCreate(kCCDecrypt, kCCAlgorithmAES, options, keyPtr, keyLength, [iv bytes], &cryptor);
    if (status != kCCSuccess) {
        NSLog(@"Failed to create cryptor with status %d", status);
        free(buffer);
        [inputFile closeFile];
        [outputFile closeFile];
        return NO;
    }

    // Read and decrypt the file in chunks
    while (YES) {
        @autoreleasepool {
            NSData *inputData = [inputFile readDataOfLength:chunkSize];
            if ([inputData length] == 0) {
                // Reached end of file
                break;
            }

            size_t numBytesDecrypted = 0;
            status = CCCryptorUpdate(cryptor, [inputData bytes], [inputData length], buffer, chunkSize + blockSize, &numBytesDecrypted);
            if (status != kCCSuccess) {
                NSLog(@"Decryption failed with status %d", status);
                CCCryptorRelease(cryptor);
                free(buffer);
                [inputFile closeFile];
                [outputFile closeFile];
                return NO;
            }

            // Write the decrypted data to the output file
            [outputFile writeData:[NSData dataWithBytesNoCopy:buffer length:numBytesDecrypted freeWhenDone:NO]];
        }
    }

    // Finalize the decryption
    size_t numBytesDecrypted = 0;
    status = CCCryptorFinal(cryptor, buffer, chunkSize + blockSize, &numBytesDecrypted);
    if (status != kCCSuccess) {
        NSLog(@"Finalizing decryption failed with status %d", status);
        CCCryptorRelease(cryptor);
        free(buffer);
        [inputFile closeFile];
        [outputFile closeFile];
        return NO;
    }

    // Write the final decrypted data to the output file
    [outputFile writeData:[NSData dataWithBytesNoCopy:buffer length:numBytesDecrypted freeWhenDone:NO]];

    // Cleanup
    CCCryptorRelease(cryptor);
    free(buffer);
    [inputFile closeFile];
    [outputFile closeFile];

    return YES;
}

RCT_EXPORT_METHOD(encryptFileWithAesCbc16:
                  (NSString *)inputFilePath
                  outputFilePath:(NSString *)outputFilePath
                  key:(NSString *)key
                  iv:(NSString *)iv
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @autoreleasepool {
    NSData *ivData = [[NSData alloc] initWithBase64EncodedString:iv options:0];
    NSData *keyData = [[NSData alloc] initWithBase64EncodedString:key options:0];

    // Encrypt the file
    if(encryptFileWithAES_CBC(inputFilePath, outputFilePath, keyData, ivData)){
      RCTLogInfo(@"Encrypted to %@", outputFilePath);
      resolve(@1);
    } else {
      reject(@"event_failure", @"no event id returned", nil);
    }
  }
}

RCT_EXPORT_METHOD(decryptFileWithAesCbc16:
                  (NSString *)inputFilePath
                  outputFilePath:(NSString *)outputFilePath
                  key:(NSString *)key
                  iv:(NSString *)iv
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  @autoreleasepool {
    NSData *ivData = [[NSData alloc] initWithBase64EncodedString:iv options:0];
    NSData *keyData = [[NSData alloc] initWithBase64EncodedString:key options:0];

    // Encrypt the file
    if(decryptFileWithAES_CBC(inputFilePath, outputFilePath, keyData, ivData)){
      // RCTLogInfo(@"Dencrypted to %@", outputFilePath);
      resolve(@1);
    } else {
      reject(@"event_failure", @"no event id returned", nil);
    }
  }
}

@end