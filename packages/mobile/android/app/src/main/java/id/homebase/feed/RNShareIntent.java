package id.homebase.feed;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.webkit.MimeTypeMap;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import org.jetbrains.annotations.NotNull;

import java.util.ArrayList;

public class RNShareIntent extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static ReactApplicationContext reactContext;


    // Events
    final String NEW_SHARE_EVENT = "NewShareEvent";

    // Keys
    final String MIME_TYPE_KEY = "mimeType";
    final String DATA_KEY = "data";

  public RNShareIntent(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        reactContext.addActivityEventListener(this);
    }

    @NotNull
    @Override
    public String getName() {
        return "ShareMenu";
    }

    @Nullable
    private WritableArray extractShared(Intent intent)  {
        String type = intent.getType();

        if (type == null) {
            return null;
        }

        String action = intent.getAction();

        WritableArray data = Arguments.createArray();
//        data.putString(MIME_TYPE_KEY, type);

        if (Intent.ACTION_SEND.equals(action)) {
            // If Single, we can depend on the MIME type to determine the data
            final WritableMap intentData = Arguments.createMap();
            intentData.putString(MIME_TYPE_KEY, type);
            if ("text/plain".equals(type)) {
                intentData.putString(DATA_KEY, intent.getStringExtra(Intent.EXTRA_TEXT));
                data.pushMap(intentData);
                return data;
            }

            Uri fileUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (fileUri != null) {
                intentData.putString(DATA_KEY, fileUri.toString());
                data.pushMap(intentData);
                return data;
            }
        } else if (Intent.ACTION_SEND_MULTIPLE.equals(action)) {
            MimeTypeMap mime = MimeTypeMap.getSingleton();
            ArrayList<Uri> fileUris = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
            if (fileUris != null) {
                for (Uri uri : fileUris) {
                WritableMap uriData = Arguments.createMap();
                // Get the mimeType
                var mimeType = getMimeType(reactContext, uri);
                    uriData.putString(DATA_KEY,uri.toString());
                    uriData.putString(MIME_TYPE_KEY, mimeType);
                    data.pushMap(uriData);
                }
                return data;
            }
        }

        return null;
    }

    private String getMimeType(Context context, Uri uri) {
        String mimeType = null;
        if (ContentResolver.SCHEME_CONTENT.equals(uri.getScheme())) {
            ContentResolver cr = context.getContentResolver();
            mimeType = cr.getType(uri);
        } else {
            String fileExtension = MimeTypeMap.getFileExtensionFromUrl(uri
                    .toString());
            mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(
                    fileExtension.toLowerCase());
        }
        return mimeType;
    }

    @ReactMethod
    public void getSharedText(Callback successCallback) {
        Activity currentActivity = getCurrentActivity();

        if (currentActivity == null) {
            return;
        }

        // If this isn't the root activity then make sure it is
        if (!currentActivity.isTaskRoot()) {
            Intent newIntent = new Intent(currentActivity.getIntent());
            newIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            currentActivity.startActivity(newIntent);

            ReadableArray shared = extractShared(newIntent);
            successCallback.invoke(shared);
            clearSharedText();
            currentActivity.finish();
            return;
        }

        Intent intent = currentActivity.getIntent();

        ReadableArray shared = extractShared(intent);
        successCallback.invoke(shared);
        clearSharedText();
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN built in Event Emitter Calls.
    }

    private void dispatchEvent(ReadableArray shared) {
        if (reactContext == null || !reactContext.hasActiveCatalystInstance()) {
            return;
        }

        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(NEW_SHARE_EVENT, shared);
    }

    public void clearSharedText() {
        Activity mActivity = getCurrentActivity();

        if(mActivity == null) { return; }

        Intent intent = mActivity.getIntent();
        String type = intent.getType();

        if (type == null) {
            return;
        }

        if ("text/plain".equals(type)) {
            intent.removeExtra(Intent.EXTRA_TEXT);
            return;
        }

        intent.removeExtra(Intent.EXTRA_STREAM);
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        // DO nothing
    }

    @Override
    public void onNewIntent(Intent intent) {
        // Possibly received a new share while the app was already running

        Activity currentActivity = getCurrentActivity();

        if (currentActivity == null) {
            return;
        }

        ReadableArray shared = extractShared(intent);
        dispatchEvent(shared);

        // Update intent in case the user calls `getSharedText` again
        currentActivity.setIntent(intent);
    }

}
