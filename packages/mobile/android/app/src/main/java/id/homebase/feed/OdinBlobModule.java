package id.homebase.feed;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import androidx.annotation.NonNull;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;


public class OdinBlobModule extends ReactContextBaseJavaModule {
    @NonNull
    @Override
    public String getName() {
        return "OdinBlobModule";
    }

    OdinBlobModule(ReactApplicationContext context) {
        super(context);
    }

    @ReactMethod
    public void encryptFileWithAesCbc16(String inputFilePath, String outputFilePath, String base64Key, String base64Iv, Promise promise) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(base64Key);
            byte[] ivBytes = Base64.getDecoder().decode(base64Iv);

            SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "AES");
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            IvParameterSpec ivSpec = new IvParameterSpec(ivBytes);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);

            if (inputFilePath.startsWith("file://")) {
                inputFilePath = inputFilePath.substring(7);
            }
            Path inputPath = Paths.get(inputFilePath);
            if (outputFilePath.startsWith("file://")) {
                outputFilePath = outputFilePath.substring(7);
            }
            Path outputPath = Paths.get(outputFilePath);

            try (FileInputStream fis = new FileInputStream(inputPath.toFile());
                 FileOutputStream fos = new FileOutputStream(outputPath.toFile())) {

                byte[] buffer = new byte[16]; // Block size for AES

                while (true) {
                    int bytesRead = fis.read(buffer);
                    if (bytesRead == -1) {
                        break; // End of file
                    }

                    byte[] encryptedBytes = cipher.update(buffer);
                    fos.write(encryptedBytes);
                }

                // Write the last block of encrypted data (with padding)
                byte[] finalEncryptedBytes = cipher.doFinal();
                fos.write(finalEncryptedBytes);
            }
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }

        promise.resolve(1);
    }


    @ReactMethod
    public void decryptFileWithAesCbc16(String inputFilePath, String outputFilePath, String base64Key, String base64Iv, Promise promise) {
        try {
            byte[] keyBytes = Base64.getDecoder().decode(base64Key);
            byte[] ivBytes = Base64.getDecoder().decode(base64Iv);

            SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "AES");
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            IvParameterSpec ivSpec = new IvParameterSpec(ivBytes);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);

            if (inputFilePath.startsWith("file://")) {
                inputFilePath = inputFilePath.substring(7);
            }
            Path inputPath = Paths.get(inputFilePath);
            if (outputFilePath.startsWith("file://")) {
                outputFilePath = outputFilePath.substring(7);
            }
            Path outputPath = Paths.get(outputFilePath);


            try (FileInputStream fis = new FileInputStream(inputPath.toFile());
                 FileOutputStream fos = new FileOutputStream(outputPath.toFile())) {

                byte[] buffer = new byte[16]; // Block size for AES

                while (true) {
                    int bytesRead = fis.read(buffer);
                    if (bytesRead == -1) {
                        break; // End of file
                    }

                    byte[] decryptedBytes = cipher.update(buffer, 0, bytesRead);
                    fos.write(decryptedBytes);
                }

                byte[] finalDecryptedBytes = cipher.doFinal();
                fos.write(finalDecryptedBytes);
            }
        } catch (Exception e) {
            e.printStackTrace();
            promise.reject(e);
        }

        promise.resolve(1);
    }
}