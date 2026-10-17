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
patch('AIRMapMarker.m','- (void)setOpacity:(double)opacity',`- (void)setVelunivoRotation:(CGFloat)value
{
    if (!isfinite(value)) return;
    _velunivoRotation = value;
    self.transform = CGAffineTransformMakeRotation(value * M_PI / 180.0);
}

- (void)setOpacity:(double)opacity`);

patch('AIRMapMarker.m','#import \"AIRMapMarker.h\"','#import \"AIRMapMarker.h\"\n#include <math.h>');
