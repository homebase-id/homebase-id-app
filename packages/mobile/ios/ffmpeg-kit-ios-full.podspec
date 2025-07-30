Pod::Spec.new do |s|
  s.name             = 'ffmpeg-kit-ios-full'
  s.version          = '6.0.2'
  s.summary          = 'FFmpegKit for iOS - Full Package'
  s.description      = 'FFmpegKit library for iOS with full features.'
  s.homepage         = 'https://github.com/homebase-id/ffmpeg-kit'
  s.license          = { :type => 'LGPL-3.0' }
  s.authors          = { 'Homebase ID' => 'info@homebase.id' }
  s.source           = { :http => 'https://github.com/homebase-id/ffmpeg-kit/releases/download/v6.0.2/ffmpegkit-bundled.xcframework.zip' }

  s.ios.deployment_target = '12.1'
  s.vendored_frameworks = [
    'ffmpegkit.xcframework',
    'libavcodec.xcframework',
    'libavdevice.xcframework',
    'libavfilter.xcframework',
    'libavformat.xcframework',
    'libavutil.xcframework',
    'libswresample.xcframework',
    'libswscale.xcframework'
  ]
  s.module_name      = 'ffmpegkit'
  s.pod_target_xcconfig = {
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386',
    'SWIFT_INCLUDE_PATHS' => '$(SRCROOT)/ffmpegkit'  # Ensure full string is quoted
  }
  s.user_target_xcconfig = {
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386'  # Ensure full string is quoted
  }
end