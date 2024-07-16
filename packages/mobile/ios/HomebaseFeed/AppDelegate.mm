#import "AppDelegate.h"
#import <Firebase.h>

#import <React/RCTBundleURLProvider.h>
// iOS 9.x or newer
#import <React/RCTLinkingManager.h>
#import <CodePush/CodePush.h>
#import <ShareMenuManager.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"HomebaseFeed";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  [FIRApp configure];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  // return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  return [CodePush bundleURL];
#endif
}

- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  //  Check if the passed url is a <YOUR_URL_SCHEME_NAME>://
    NSString *urlString = url.absoluteString;
  NSLog(@"Entered with the following string: %@s", urlString);
    
  // Check if its "homebase-share"
    if ([urlString hasPrefix:@"homebase-share://"]) {
     
      return [ShareMenuManager application:application openURL:url options:options];
    }
  
  return [RCTLinkingManager application:application openURL:url options:options];
}

@end
