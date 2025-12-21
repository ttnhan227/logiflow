package com.logiflow.client_mobile;

import android.content.Intent;
import io.flutter.embedding.android.FlutterActivity;
import io.flutter.embedding.engine.FlutterEngine;
import io.flutter.plugin.common.MethodChannel;

public class MainActivity extends FlutterActivity {
    private static final String GPS_CHANNEL = "com.logiflow.client_mobile/gps_service";

    @Override
    public void configureFlutterEngine(FlutterEngine flutterEngine) {
        super.configureFlutterEngine(flutterEngine);

        new MethodChannel(flutterEngine.getDartExecutor().getBinaryMessenger(), GPS_CHANNEL)
            .setMethodCallHandler(
                (call, result) -> {
                    switch (call.method) {
                        case "startGpsService":
                            startGpsForegroundService();
                            result.success("GPS service started");
                            break;
                        case "stopGpsService":
                            stopGpsForegroundService();
                            result.success("GPS service stopped");
                            break;
                        default:
                            result.notImplemented();
                            break;
                    }
                }
            );
    }

    private void startGpsForegroundService() {
        Intent serviceIntent = new Intent(this, GpsForegroundService.class);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    private void stopGpsForegroundService() {
        Intent serviceIntent = new Intent(this, GpsForegroundService.class);
        stopService(serviceIntent);
    }
}
