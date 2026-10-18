import fs from 'node:fs';
const root='node_modules/react-native-maps/ios/AirMaps/';
function patch(name,old,next){const path=root+name;let source=fs.readFileSync(path,'utf8');if(source.includes(next))return;if(!source.includes(old))throw new Error(`Map overlay patch no longer matches ${name}`);fs.writeFileSync(path,source.replace(old,next));}
patch('AIRMapPolyline.h','@property (nonatomic, assign) BOOL geodesic;','@property (nonatomic, assign) BOOL geodesic;\n@property (nonatomic, assign) NSInteger velunivoZIndex;\n- (void)update;');
patch('AIRMapPolylineManager.m','RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)','RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)\nRCT_REMAP_VIEW_PROPERTY(zIndex, velunivoZIndex, NSInteger)');
patch('AIRMapPolyline.m','- (void) update\n{', '- (void)setVelunivoZIndex:(NSInteger)value { _velunivoZIndex = value; [self update]; }\n\n- (void) update\n{');
patch('AIRMapPolyline.m','[_map addOverlay:self];',`[_map addOverlay:self level:self.velunivoZIndex >= 100 ? MKOverlayLevelAboveLabels : MKOverlayLevelAboveRoads];
    // MapKit ignores the React child order when an overlay updates. Keep route strokes sorted.
    if (self.velunivoZIndex >= 100) {
        NSMutableArray<AIRMapPolyline *> *routes = [NSMutableArray new];
        for (id<MKOverlay> overlay in _map.overlays) {
            if ([overlay isKindOfClass:[AIRMapPolyline class]] && ((AIRMapPolyline *)overlay).velunivoZIndex >= 100) [routes addObject:(AIRMapPolyline *)overlay];
        }
        [routes sortUsingComparator:^NSComparisonResult(AIRMapPolyline *a, AIRMapPolyline *b) {
            return a.velunivoZIndex < b.velunivoZIndex ? NSOrderedAscending : a.velunivoZIndex > b.velunivoZIndex ? NSOrderedDescending : NSOrderedSame;
        }];
        for (AIRMapPolyline *route in routes) { [_map removeOverlay:route]; [_map addOverlay:route level:MKOverlayLevelAboveLabels]; }
    }`);
patch('AIRMap.mm','((AIRMapPolyline *)subview).map = self;\n        [self addOverlay:(id<MKOverlay>)subview];','((AIRMapPolyline *)subview).map = self;\n        [(AIRMapPolyline *)subview update];');
// MapKit's marker manager does not implement the public rotation prop (Google/Android do).
// Rotate the annotation view in screen coordinates; JS supplies heading minus camera bearing.
patch('AIRMapMarker.h','@property (nonatomic, assign) double opacity;','@property (nonatomic, assign) double opacity;\n@property (nonatomic, assign) CGFloat velunivoRotation;');
patch('AIRMapMarkerManager.m','RCT_EXPORT_VIEW_PROPERTY(opacity, double)','RCT_EXPORT_VIEW_PROPERTY(opacity, double)\nRCT_REMAP_VIEW_PROPERTY(rotation, velunivoRotation, CGFloat)');
{const p=root+'AIRMapMarker.m';let v=fs.readFileSync(p,'utf8');const old=`- (void)setVelunivoRotation:(CGFloat)value
{
    if (!isfinite(value)) return;
    _velunivoRotation = value;
    self.transform = CGAffineTransformMakeRotation(value * M_PI / 180.0);
}

`;if(v.includes(old)){v=v.replace(old,'');fs.writeFileSync(p,v);}}
patch('AIRMapMarker.m','- (void)setOpacity:(double)opacity',`- (void)setVelunivoRotation:(CGFloat)value
{
    if (!isfinite(value)) return;
    _velunivoRotation = value;
    [self updateVelunivoRotation];
}

- (void)updateVelunivoRotation
{
    BOOL navigation = [self.identifier isEqualToString:@"velunivo-navigation"];
    CGFloat heading = navigation ? self.velunivoRotation - self.map.camera.heading : self.velunivoRotation;
    self.transform = CGAffineTransformMakeRotation(heading * M_PI / 180.0);
    if (navigation) { self.layer.shadowOpacity = 0; self.layer.shadowPath = nil; }
}

- (void)setOpacity:(double)opacity`);

patch('AIRMapMarker.m','#import \"AIRMapMarker.h\"','#import \"AIRMapMarker.h\"\n#include <math.h>');
// MapKit camera centering does not consistently account for asymmetric margins on resize.
// Resolve the desired screen point with MapKit's projection, then animate once from the original camera.
patch('AIRMapManager.m','[AIRMap animateWithDuration:duration/1000 animations:^{',`UIEdgeInsets padding = mapView.mapPadding;
            CGRect available = UIEdgeInsetsInsetRect(mapView.bounds, padding);
            if (available.size.width > 44 && available.size.height > 44 &&
                (padding.left != padding.right || padding.top != padding.bottom)) {
                MKMapCamera *originalCamera = [mapView.camera copy];
                camera = [camera copy];
                CLLocationCoordinate2D anchor = camera.centerCoordinate;
                CGPoint target = CGPointMake(CGRectGetMidX(available), CGRectGetMidY(available));
                for (NSInteger pass = 0; pass < 2; pass++) {
                    [mapView setCamera:camera animated:NO];
                    [mapView layoutIfNeeded];
                    CGPoint actual = [mapView convertCoordinate:anchor toPointToView:mapView];
                    CGPoint center = [mapView convertCoordinate:camera.centerCoordinate toPointToView:mapView];
                    CLLocationCoordinate2D shifted = [mapView convertPoint:CGPointMake(center.x + actual.x - target.x, center.y + actual.y - target.y) toCoordinateFromView:mapView];
                    if (!CLLocationCoordinate2DIsValid(shifted)) break;
                    camera.centerCoordinate = shifted;
                }
                [mapView setCamera:originalCamera animated:NO];
            }
            [AIRMap animateWithDuration:duration/1000 animations:^{`);

// Bundled marker images must not depend on RCTBridge.currentBridge in bridgeless RN.
patch('AIRMapMarker.m', '    _imageSrc = imageSrc;', `    _imageSrc = imageSrc;
    NSURL *localURL = [RCTConvert NSURL:imageSrc];
    if (localURL.isFileURL) {
        UIImage *bundled = [UIImage imageWithContentsOfFile:localURL.path];
        if (bundled) {
            self.layer.shadowOpacity = 0;
            self.layer.shadowPath = nil;
            self.image = bundled;
            return;
        }
    }`);

patch('AIRMapMarker.h','@property (nonatomic, assign) CGFloat velunivoRotation;','@property (nonatomic, assign) CGFloat velunivoRotation;\n- (void)updateVelunivoRotation;');
patch('AIRMapManager.m','    [self _regionChanged:mapView continuous:YES];',`    for (id<MKAnnotation> annotation in mapView.annotations) {
        if ([annotation isKindOfClass:[AIRMapMarker class]] && [((AIRMapMarker *)annotation).identifier isEqualToString:@"velunivo-navigation"]) {
            [((AIRMapMarker *)annotation) updateVelunivoRotation];
        }
    }
    [self _regionChanged:mapView continuous:YES];`);
