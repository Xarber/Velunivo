# Vehicle pictures and back navigation

Vehicle appearance offers Photo Library, Files and Take a picture. Every source is center-cropped to a square before creating a 512 × 512 JPEG. Existing saved pictures remain available. Camera permission is requested only for the camera action, and microphone permission stays disabled. Native camera permission configuration needs a new GitHub-built binary. Web uses the browser image picker/camera capture support; availability of an actual camera is browser/device dependent.

The protected Sharing E-Scooter uses a minimal accent scooter outline instead of the generic emoji, without replacing a user's selected picture or custom icon. Existing records with the original emoji get the new visual automatically.

Vehicle, Bluetooth, Library and Settings back arrows now call router.back when history exists, instead of replacing/navigating forward to the parent. Direct links without history fall back to replacing the appropriate parent. Actions that open a route or finish/delete an item keep their existing navigation behavior.

Validation: 220 JavaScript tests pass, including centered cropping for portrait/landscape/odd sizes and invalid dimensions; TypeScript passes. Native photo/camera interaction requires the next native binary and physical camera testing; no local native compilation performed. Expo SDK 57 ImagePicker, ImageManipulator and Router navigation documentation was checked before the changes.
