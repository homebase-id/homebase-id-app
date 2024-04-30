//package id.homebase.feed;
//
//import android.app.Activity;
//import android.content.Intent;
//import android.net.Uri;
//import android.os.Bundle;
//import com.facebook.react.ReactInstanceManager;
//import com.facebook.react.bridge.ReactContext;
//import com.facebook.react.modules.core.DeviceEventManagerModule;
//
//public class ShareActivity extends Activity {
//
//    @Override
//    protected void onCreate(Bundle savedInstanceState) {
//        super.onCreate(savedInstanceState);
//
//        // Obtain the ReactInstanceManager
//        ReactInstanceManager reactInstanceManager = ((MainApplication) getApplication()).getReactNativeHost().getReactInstanceManager();
//
//        ReactContext reactContext = ((MainApplication) getApplication()).getReactNativeHost().getReactInstanceManager().getCurrentReactContext();
//
//        if (reactContext != null) {
//            handleShareIntent(reactContext);
//        } else {
//            reactInstanceManager.addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
//                @Override
//                public void onReactContextInitialized(ReactContext context) {
//                    handleShareIntent(context);
//                }
//            });
//        }
//    }
//
//    private void handleShareIntent(ReactContext reactContext) {
//        Intent receivedIntent = getIntent();
//        String action = receivedIntent.getAction();
//        String type = receivedIntent.getType();
//
//        if (Intent.ACTION_SEND.equals(action) && type != null) {
//            if ("text/plain".equals(type)) {
//                handleTextContent(reactContext,receivedIntent);
//            } else if (type.startsWith("image/")) {
//                handleImageContent(reactContext,receivedIntent);
//            }
//        }
//
//        // Finish the activity
//        finish();
//    }
//
//    private void handleTextContent(ReactContext reactContext,Intent intent) {
//        String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
//        if (sharedText != null) {
//            // Pass the shared text to React Native
//            reactContext
//                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
//                    .emit("onTextShared", sharedText);
//        }
//    }
//
//    private void handleImageContent(ReactContext reactContext,Intent intent) {
//        Uri imageUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
//        if (imageUri != null) {
//            // Pass the image URI to React Native
//            String imageUrl = imageUri.toString();
//            reactContext
//                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
//                    .emit("onImageShared", imageUrl);
//        }
//        // Handle shared image content here
//    }
//}