import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import '../api_client.dart';

// Model for upload response
class UploadResponse {
  final String path;

  UploadResponse({required this.path});

  factory UploadResponse.fromJson(Map<String, dynamic> json) {
    return UploadResponse(path: json['path']);
  }
}

class UploadService {
  Future<UploadResponse> uploadProfilePicture(dynamic file) async {
    final uri = Uri.parse('${ApiClient.baseUrl}/uploads/profile-picture');

    // Get headers (add auth if needed)
    final headers = await apiClient.getHeaders()..remove('Content-Type');

    // Create multipart request
    final request = http.MultipartRequest('POST', uri);

    // Add headers to request
    headers.forEach((key, value) {
      request.headers[key] = value;
    });
    request.headers['Content-Type'] = 'multipart/form-data';

    // Extract filename and bytes safely across Web and Mobile
    String fileName = 'image.jpg';
    List<int> bytes = [];

    if (file is XFile) {
      fileName = file.name;
      bytes = await file.readAsBytes();
    } else if (file != null) {
      try {
        fileName = file.path.toString().split('/').last.split('\\').last;
        bytes = await file.readAsBytes();
      } catch (_) {
        fileName = 'upload.jpg';
      }
    }

    String extension = fileName.split('.').last.toLowerCase();
    MediaType mediaType;
    if (extension == 'jpg' || extension == 'jpeg') {
      mediaType = MediaType('image', 'jpeg');
    } else if (extension == 'png') {
      mediaType = MediaType('image', 'png');
    } else if (extension == 'gif') {
      mediaType = MediaType('image', 'gif');
    } else {
      mediaType = MediaType('application', 'octet-stream');
    }

    request.files.add(http.MultipartFile.fromBytes(
      'file',
      bytes,
      filename: fileName,
      contentType: mediaType,
    ));

    try {
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return UploadResponse.fromJson(data);
      } else {
        throw Exception('Upload failed: HTTP ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      throw Exception('Upload failed: $e');
    }
  }

  Future<UploadResponse> uploadLicenseImage(dynamic file) async {
    final uri = Uri.parse('${ApiClient.baseUrl}/uploads/license-image');

    final headers = await apiClient.getHeaders()..remove('Content-Type');
    final request = http.MultipartRequest('POST', uri);
    headers.forEach((key, value) {
      request.headers[key] = value;
    });
    request.headers['Content-Type'] = 'multipart/form-data';

    String fileName = 'license.jpg';
    List<int> bytes = [];

    if (file is XFile) {
      fileName = file.name;
      bytes = await file.readAsBytes();
    } else if (file != null) {
      try {
        fileName = file.path.toString().split('/').last.split('\\').last;
        bytes = await file.readAsBytes();
      } catch (_) {
        fileName = 'license.jpg';
      }
    }

    String extension = fileName.split('.').last.toLowerCase();
    MediaType mediaType;
    if (extension == 'jpg' || extension == 'jpeg') {
      mediaType = MediaType('image', 'jpeg');
    } else if (extension == 'png') {
      mediaType = MediaType('image', 'png');
    } else if (extension == 'gif') {
      mediaType = MediaType('image', 'gif');
    } else {
      mediaType = MediaType('application', 'octet-stream');
    }

    request.files.add(http.MultipartFile.fromBytes(
      'file',
      bytes,
      filename: fileName,
      contentType: mediaType,
    ));

    try {
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return UploadResponse.fromJson(data);
      } else {
        throw Exception('Upload failed: ${response.body}');
      }
    } catch (e) {
      throw Exception('Upload failed: $e');
    }
  }

  Future<UploadResponse> uploadCV(dynamic file) async {
    final uri = Uri.parse('${ApiClient.baseUrl}/uploads/cv');

    final headers = await apiClient.getHeaders()..remove('Content-Type');
    final request = http.MultipartRequest('POST', uri);
    headers.forEach((key, value) {
      request.headers[key] = value;
    });
    request.headers['Content-Type'] = 'multipart/form-data';

    String fileName = 'document.pdf';
    List<int> bytes = [];

    if (file is XFile) {
      fileName = file.name;
      bytes = await file.readAsBytes();
    } else if (file != null) {
      try {
        fileName = file.path.toString().split('/').last.split('\\').last;
        bytes = await file.readAsBytes();
      } catch (_) {
        fileName = 'document.pdf';
      }
    }

    request.files.add(http.MultipartFile.fromBytes(
      'file',
      bytes,
      filename: fileName,
      contentType: MediaType('application', 'pdf'),
    ));

    try {
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return UploadResponse.fromJson(data);
      } else {
        throw Exception('Upload failed: ${response.body}');
      }
    } catch (e) {
      throw Exception('Upload failed: $e');
    }
  }
}

// Singleton instance
final uploadService = UploadService();
