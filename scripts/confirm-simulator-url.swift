// CI-only: click the exact Open button after the device screenshot proved our URL dialog.
import AppKit
import Vision
import CoreGraphics
import Foundation

guard ProcessInfo.processInfo.environment["GITHUB_ACTIONS"] == "true",CommandLine.arguments.count==2 else {fatalError("Only disposable GitHub capture runners may invoke this helper")}
let url=URL(fileURLWithPath:CommandLine.arguments[1])
let task=Process();task.executableURL=URL(fileURLWithPath:"/usr/sbin/screencapture");task.arguments=["-x",url.path];try task.run();task.waitUntilExit();guard task.terminationStatus==0 else{fatalError("Host capture failed")}
let request=VNRecognizeTextRequest();request.recognitionLevel = .accurate
try VNImageRequestHandler(url:url).perform([request])
let buttons=(request.results ?? []).filter{$0.topCandidates(1).first?.string.trimmingCharacters(in:.whitespacesAndNewlines)=="Open"}
guard buttons.count==1 else{fatalError("Expected exactly one Open button in the owned Simulator window")}
let box=buttons[0].boundingBox,screen=CGDisplayBounds(CGMainDisplayID())
let point=CGPoint(x:screen.minX+box.midX*screen.width,y:screen.minY+(1-box.midY)*screen.height)
for type in [CGEventType.leftMouseDown,.leftMouseUp]{guard let event=CGEvent(mouseEventSource:nil,mouseType:type,mouseCursorPosition:point,mouseButton:.left) else{fatalError("Could not create Simulator click")};event.post(tap:.cghidEventTap);Thread.sleep(forTimeInterval:0.1)}
