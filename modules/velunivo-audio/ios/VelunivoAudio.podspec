Pod::Spec.new do |s|
  s.name = 'VelunivoAudio'
  s.version = '1.0.0'
  s.summary = 'Owned navigation speech session with explicit music restoration'
  s.description = s.summary
  s.license = { :type => 'MIT' }
  s.author = 'Velunivo'
  s.homepage = 'https://github.com/Xarber/Velunivo'
  s.platforms = { :ios => '16.4' }
  s.source = { :git => 'https://github.com/Xarber/Velunivo' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
  s.swift_version = '5.9'
end
