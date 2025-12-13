import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
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
  Future<UploadResponse> uploadProfilePicture(File file) async {
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

    // Add file with correct MIME type
    String extension = file.path.split('.').last.toLowerCase();
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

    request.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
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

  Future<UploadResponse> uploadLicenseImage(File file) async {
    final uri = Uri.parse('${ApiClient.baseUrl}/uploads/license-image');

    final headers = await apiClient.getHeaders()..remove('Content-Type');
    final request = http.MultipartRequest('POST', uri);
    headers.forEach((key, value) {
      request.headers[key] = value;
    });
    request.headers['Content-Type'] = 'multipart/form-data';

    // Add file with correct MIME type
    String extension = file.path.split('.').last.toLowerCase();
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

    request.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
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

  Future<UploadResponse> uploadCV(File file) async {
    final uri = Uri.parse('${ApiClient.baseUrl}/uploads/cv');

    final headers = await apiClient.getHeaders()..remove('Content-Type');
    final request = http.MultipartRequest('POST', uri);
    headers.forEach((key, value) {
      request.headers[key] = value;
    });
    request.headers['Content-Type'] = 'multipart/form-data';

    request.files.add(await http.MultipartFile.fromPath(
      'file',
      file.path,
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
