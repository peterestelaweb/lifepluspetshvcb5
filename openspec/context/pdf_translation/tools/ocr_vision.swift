import AppKit
import Foundation
import Vision

struct OCRLine: Codable {
    let text: String
    let x: Double
    let y: Double
    let width: Double
    let height: Double
    let confidence: Double
}

struct OCROutput: Codable {
    let imagePath: String
    let imageWidth: Int
    let imageHeight: Int
    let lines: [OCRLine]
}

func fail(_ message: String) -> Never {
    fputs("Error: \(message)\n", stderr)
    exit(1)
}

if CommandLine.arguments.count < 2 {
    fail("Usage: swift ocr_vision.swift <image_path>")
}

let imagePath = CommandLine.arguments[1]
let imageURL = URL(fileURLWithPath: imagePath)

guard let nsImage = NSImage(contentsOf: imageURL) else {
    fail("Cannot open image: \(imagePath)")
}

guard let cgImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    fail("Cannot decode CGImage")
}

let imgWidth = cgImage.width
let imgHeight = cgImage.height

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.recognitionLanguages = ["en-US"]
request.minimumTextHeight = 0.01

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
    try handler.perform([request])
} catch {
    fail("Vision OCR failed: \(error.localizedDescription)")
}

guard let observations = request.results else {
    fail("No OCR observations")
}

var lines: [OCRLine] = []
for obs in observations {
    guard let candidate = obs.topCandidates(1).first else { continue }
    let rect = obs.boundingBox
    let x = rect.origin.x * Double(imgWidth)
    let y = rect.origin.y * Double(imgHeight)
    let w = rect.size.width * Double(imgWidth)
    let h = rect.size.height * Double(imgHeight)
    lines.append(
        OCRLine(
            text: candidate.string,
            x: x,
            y: y,
            width: w,
            height: h,
            confidence: Double(candidate.confidence)
        )
    )
}

let output = OCROutput(
    imagePath: imagePath,
    imageWidth: imgWidth,
    imageHeight: imgHeight,
    lines: lines
)

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
do {
    let data = try encoder.encode(output)
    if let json = String(data: data, encoding: .utf8) {
        print(json)
    } else {
        fail("Cannot encode JSON output")
    }
} catch {
    fail("Encoding failed: \(error.localizedDescription)")
}
