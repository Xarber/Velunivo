Pod::Spec.new do |s|
  s.name = 'VelunivoRideWake'
  s.version = '1.0.0'
  s.summary = 'Opt-in significant-location-change wake for ride detection'
  s.license = { :type => 'AGPL-3.0-only' }
  s.author = 'Velunivo'
  s.homepage = 'https://github.com/Xarber/Velunivo'
  s.source = { :git => 'https://github.com/Xarber/Velunivo' }
  s.platforms = { :ios => '16.4' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreLocation', 'UserNotifications'
  s.source_files = '**/*.swift'
  s.swift_version = '5.9'
end
